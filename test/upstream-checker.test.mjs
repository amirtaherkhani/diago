import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkUpstreams, formatUpstreamReport } from '../lib/upstream-checker.mjs';
import { fromRoot } from '../lib/paths.mjs';

const oldSha = 'a'.repeat(40);
const newSha = 'b'.repeat(40);
const source = { repository: 'https://github.com/example/project', ref: 'main', commit: oldSha };
const response = (body) => ({ ok: true, json: async () => body });

test('checks independent sources concurrently with a four-request limit and stable output order', async () => {
  const sources = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`source-${i}`, source]));
  let active = 0;
  let peak = 0;
  const releases = [];
  const resultPromise = checkUpstreams(sources, { fetchImpl: async () => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => releases.push(resolve));
    active -= 1;
    return response({ sha: newSha });
  } });
  assert.equal(active, 4);
  // Free only one worker; the fifth source must start while the other three still wait.
  releases.shift()();
  await new Promise(setImmediate);
  assert.equal(active, 4);
  while (releases.length) {
    releases.shift()();
    await new Promise(setImmediate);
  }
  const result = await resultPromise;
  assert.equal(peak, 4);
  assert.deepEqual(Object.keys(result), Object.keys(sources));
  assert.ok(Object.values(result).every((item) => item.changed === true));
});

test('isolates HTTP failure and never reports an unresolved source as current', async () => {
  const result = await checkUpstreams({ good: source, bad: { ...source, ref: 'bad' } }, {
    fetchImpl: async (url) => url.endsWith('/bad')
      ? { ok: false, status: 503 }
      : response({ sha: oldSha }),
  });
  assert.equal(result.good.changed, false);
  assert.equal(result.bad.changed, null);
  assert.equal(result.bad.latest, null);
  assert.match(result.bad.error, /HTTP 503/);
  assert.match(formatUpstreamReport(result), /CURRENT good.*\nERROR bad:/);
});

test('times out a stalled source while preserving successful results', async () => {
  const result = await checkUpstreams({ good: source, slow: { ...source, ref: 'slow' } }, {
    timeoutMs: 20,
    fetchImpl: async (url, { signal }) => url.endsWith('/slow')
      ? new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
      : response({ sha: oldSha }),
  });
  assert.equal(result.good.changed, false);
  assert.match(result.slow.error, /timed out/);
});

test('rejects malformed API contracts including empty tags and non-string SHAs', async () => {
  for (const body of [[], {}, { sha: 'short' }, { sha: [oldSha] }]) {
    const result = await checkUpstreams({ archify: source, branch: source }, { fetchImpl: async () => response(body) });
    assert.equal(result.archify.changed, null);
    assert.equal(result.branch.changed, null);
  }
});

test('resolves tags and configured refs without leaking transport errors', async () => {
  const urls = [];
  const result = await checkUpstreams({ archify: source, branch: { ...source, ref: 'release/next' }, broken: source }, {
    fetchImpl: async (url) => {
      urls.push(url);
      if (urls.length === 3) throw new Error('private-token-value');
      return response(url.includes('/tags?') ? [{ name: 'v3.0.1', commit: { sha: newSha } }] : { sha: oldSha });
    },
  });
  assert.equal(result.archify.latest.ref, 'v3.0.1');
  assert.ok(urls.some((url) => url.endsWith('commits/release%2Fnext')));
  assert.equal(result.broken.error, 'GitHub request failed.');
});

test('rejects unsupported repository URLs before sending credentials', async () => {
  const result = await checkUpstreams({ bad: { ...source, repository: 'https://example.com/repo' } }, {
    fetchImpl: () => assert.fail('must not fetch'), token: 'secret',
  });
  assert.match(result.bad.error, /Unsupported repository/);
});

test('CLI emits the complete JSON report and exits nonzero on partial failure', () => {
  const mock = `globalThis.fetch = async (url) => url.includes('/archify/') ? { ok: false, status: 503 } : { ok: true, json: async () => ({ sha: '${oldSha}' }) };`;
  const run = spawnSync(process.execPath, [
    '--input-type=module', '--eval',
    `${mock} await import(${JSON.stringify(pathToFileURL(fromRoot('scripts', 'check-upstreams.mjs')).href)});`,
    '--', '--json',
  ], { encoding: 'utf8' });
  assert.equal(run.status, 1, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(Object.keys(report).length, 4);
  assert.equal(report.archify.changed, null);
  assert.ok(report['diagram-design'].latest);
});


test('rejects empty discovery and isolates malformed pins', async () => {
  await assert.rejects(checkUpstreams({}), /configured upstream/);
  const result = await checkUpstreams({ good: source, malformed: null }, { fetchImpl: async () => response({ sha: oldSha }) });
  assert.equal(result.good.changed, false);
  assert.equal(result.malformed.changed, null);
  assert.match(result.malformed.error, /Invalid pinned/);
});
