const MAX_CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 15_000;
const COMMIT_SHA = /^[a-f0-9]{40}$/i;

class GitHubResponseError extends Error {}

async function resolveLatest(name, source, { fetchImpl, token, timeoutMs }) {
  const repository = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)\/?$/.exec(source.repository);
  if (!repository) throw new Error('Unsupported repository URL; expected a GitHub repository.');
  const repo = repository[1].replace(/\.git$/, '');
  const tagged = name === 'archify';
  if (!tagged && (typeof source.ref !== 'string' || !source.ref.trim())) {
    throw new Error('Missing upstream ref.');
  }
  const endpoint = tagged ? 'tags?per_page=1' : `commits/${encodeURIComponent(source.ref)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}/${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'diago',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new GitHubResponseError(`GitHub API returned HTTP ${response.status}.`);
    let body;
    try {
      body = await response.json();
    } catch {
      throw new GitHubResponseError('GitHub API returned invalid JSON.');
    }
    const latest = tagged
      ? { ref: body?.[0]?.name, commit: body?.[0]?.commit?.sha }
      : { ref: source.ref, commit: body?.sha };
    if (typeof latest.ref !== 'string' || !latest.ref.trim() || typeof latest.commit !== 'string' || !COMMIT_SHA.test(latest.commit)) {
      throw new GitHubResponseError('GitHub API returned no valid ref and full commit SHA.');
    }
    return latest;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`GitHub request timed out after ${timeoutMs} ms.`);
    // Avoid propagating transport errors that may contain credentials or local details.
    if (error instanceof GitHubResponseError) throw error;
    throw new Error('GitHub request failed.');
  } finally {
    clearTimeout(timer);
  }
}

export async function checkUpstreams(sources, {
  fetchImpl = globalThis.fetch,
  token,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new TypeError('timeoutMs must be a positive integer.');
  if (!sources || typeof sources !== 'object' || Array.isArray(sources) || Object.keys(sources).length === 0) {
    throw new TypeError('At least one configured upstream source is required.');
  }
  const entries = Object.entries(sources);
  const results = new Array(entries.length);
  const pending = entries.entries();
  // Each worker takes its next source immediately; there is no barrier between batches.
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, entries.length) }, async () => {
    for (const [index, [name, source]] of pending) {
      const current = { ref: source?.ref ?? null, commit: source?.commit ?? null };
      try {
        if (typeof current.ref !== 'string' || !current.ref.trim() || typeof current.commit !== 'string' || !COMMIT_SHA.test(current.commit)) {
          throw new Error('Invalid pinned ref or commit SHA.');
        }
        const latest = await resolveLatest(name, source, { fetchImpl, token, timeoutMs });
        results[index] = [name, { current, latest, changed: current.commit !== latest.commit }];
      } catch (error) {
        results[index] = [name, { current, latest: null, changed: null, error: error.message }];
      }
    }
  }));
  return Object.fromEntries(results);
}

export function formatUpstreamReport(result) {
  return Object.entries(result).map(([name, status]) => status.error
    ? `ERROR ${name}: ${status.error}`
    : `${status.changed ? 'UPDATE' : 'CURRENT'} ${name} ${status.current.ref} → ${status.latest.ref}`
  ).join('\n');
}
