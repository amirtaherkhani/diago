import { safeSourceLabel } from './reviewer.mjs';

const ID = /^[a-z][a-z0-9_-]{0,63}$/;
const ATTEMPT_STATES = ['running', 'succeeded', 'failed', 'timed-out'];
const VERDICTS = ['supported', 'unverified', 'contradicted'];

function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new TypeError(`${label} contains unknown fields.`);
}

function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw new TypeError(`${label} must be an integer from ${min} to ${max}.`);
  return value;
}

function text(value, label, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > 2000 || !safeSourceLabel(value)) {
    throw new TypeError(`${label} must be public text of ${min}–2000 characters, without secret values or local absolute paths.`);
  }
}

function array(value, max, label) {
  if (!Array.isArray(value) || value.length > max) throw new TypeError(`${label} must be an array with at most ${max} entries.`);
}

function effectiveStatus(attempt, timeoutMs) {
  return ['running', 'succeeded'].includes(attempt.status) && attempt.elapsedMs >= timeoutMs
    ? 'timed-out' : attempt.status;
}

function validateAttempt(attempt, label) {
  object(attempt, ['status', 'elapsedMs', 'retryable', 'error', 'claims'], label);
  if (!ATTEMPT_STATES.includes(attempt.status)) throw new TypeError(`${label}.status is invalid.`);
  integer(attempt.elapsedMs, 0, Number.MAX_SAFE_INTEGER, `${label}.elapsedMs`);
  if (attempt.status === 'succeeded') {
    array(attempt.claims, 20, `${label}.claims`);
    if (!attempt.claims.length) throw new TypeError(`${label}.claims must contain at least one reported claim.`);
    const ids = new Set();
    for (const claim of attempt.claims) {
      object(claim, ['id', 'statement', 'source', 'verdict', 'reason'], `${label}.claim`);
      if (typeof claim.id !== 'string' || !ID.test(claim.id) || ids.has(claim.id)) throw new TypeError(`${label} needs unique claim IDs.`);
      ids.add(claim.id);
      text(claim.statement, 'Claim statement', 6);
      text(claim.source, 'Claim source');
      text(claim.reason, 'Verification reason', 6);
      if (!VERDICTS.includes(claim.verdict)) throw new TypeError('Claim verdict is invalid.');
    }
    if ('error' in attempt || 'retryable' in attempt) throw new TypeError(`${label}: succeeded attempts cannot contain failure fields.`);
  } else {
    if ('claims' in attempt) throw new TypeError(`${label}: only succeeded attempts can return claims.`);
    if (attempt.status === 'failed') {
      text(attempt.error, `${label}.error`);
      if (typeof attempt.retryable !== 'boolean') throw new TypeError(`${label}.retryable must be a boolean.`);
    } else if ('error' in attempt || 'retryable' in attempt) {
      throw new TypeError(`${label}: failure fields require failed status.`);
    }
  }
}

function validateWorkflow(input) {
  object(input, ['schemaVersion', 'concurrency', 'maxAttempts', 'timeoutMs', 'nodes'], 'workflow');
  if (Buffer.byteLength(JSON.stringify(input)) > 1_000_000) throw new TypeError('Workflow exceeds the 1 MB limit.');
  if (input.schemaVersion !== 1) throw new TypeError('Workflow schemaVersion must be 1.');
  const limits = {
    concurrency: integer(input.concurrency === undefined ? 3 : input.concurrency, 1, 4, 'concurrency'),
    maxAttempts: integer(input.maxAttempts === undefined ? 2 : input.maxAttempts, 1, 3, 'maxAttempts'),
    timeoutMs: integer(input.timeoutMs === undefined ? 15_000 : input.timeoutMs, 1, 300_000, 'timeoutMs'),
  };
  array(input.nodes, 32, 'nodes');
  if (!input.nodes.length) throw new TypeError('At least one evidence node is required.');
  const nodes = new Map();
  for (const node of input.nodes) {
    object(node, ['id', 'question', 'dependsOn', 'attempts'], 'node');
    if (typeof node.id !== 'string' || !ID.test(node.id) || nodes.has(node.id)) throw new TypeError('Node IDs must be unique lowercase identifiers.');
    text(node.question, 'Node question', 6);
    array(node.dependsOn, 31, 'dependsOn');
    if (new Set(node.dependsOn).size !== node.dependsOn.length) throw new TypeError('Duplicate dependency.');
    array(node.attempts, limits.maxAttempts, 'attempts');
    node.attempts.forEach((attempt, index) => {
      validateAttempt(attempt, `${node.id}.attempts[${index}]`);
      if (index < node.attempts.length - 1) {
        const state = effectiveStatus(attempt, limits.timeoutMs);
        if (state !== 'timed-out' && !(state === 'failed' && attempt.retryable)) {
          throw new TypeError('Only timed-out or explicitly retryable failed attempts may be retried.');
        }
      }
    });
    nodes.set(node.id, node);
  }
  const visiting = new Set();
  const visited = new Set();
  const ordered = [];
  function visit(id) {
    if (!nodes.has(id)) throw new TypeError('Unknown dependency ID.');
    if (visiting.has(id)) throw new TypeError('Evidence dependencies must be acyclic.');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of nodes.get(id).dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(nodes.get(id));
  }
  for (const id of nodes.keys()) visit(id);
  return { limits, ordered };
}

function collectClaims(nodes, states) {
  const groups = new Map();
  for (const node of nodes) {
    if (states.get(node.id).status !== 'succeeded') continue;
    for (const claim of node.attempts.at(-1).claims) {
      const reports = groups.get(claim.id) ?? [];
      reports.push({ nodeId: node.id, ...claim });
      groups.set(claim.id, reports);
    }
  }
  const evidence = { facts: [], assumptions: [], recommendations: [], superseded: [] };
  const conflicts = [];
  const rejected = [];
  const unresolved = [];
  for (const [id, reports] of groups) {
    const statements = new Set(reports.map((claim) => claim.statement.trim().replace(/\s+/g, ' ')));
    const verdicts = new Set(reports.map((claim) => claim.verdict));
    if (statements.size > 1 || (verdicts.has('supported') && verdicts.has('contradicted'))) {
      conflicts.push({ id, reports });
      continue;
    }
    if (verdicts.has('contradicted')) {
      rejected.push({ id, reports });
      continue;
    }
    if (verdicts.has('unverified')) {
      unresolved.push({ id, reports });
      for (const claim of reports) {
        if (claim.verdict === 'unverified') evidence.assumptions.push({ statement: claim.statement, source: claim.source });
      }
      continue;
    }
    // Preserve distinct citations while removing identical statement/source pairs.
    const seen = new Set();
    for (const claim of reports) {
      const key = JSON.stringify([claim.statement, claim.source]);
      if (!seen.has(key)) evidence.facts.push({ statement: claim.statement, source: claim.source });
      seen.add(key);
    }
  }
  return { evidence, conflicts, rejected, unresolved };
}

// Pure snapshot evaluation: the caller owns execution, elapsed time, and persistence.
export function planEvidenceWorkflow(input) {
  const { limits, ordered } = validateWorkflow(input);
  const states = new Map();
  for (const node of ordered) {
    const dependencies = node.dependsOn.map((id) => states.get(id));
    const ready = dependencies.every((item) => item.status === 'succeeded');
    if (node.attempts.length && !ready) throw new TypeError('Attempted nodes require succeeded dependencies.');
    let status = ready ? 'pending' : dependencies.some((item) => ['failed', 'blocked'].includes(item.status)) ? 'blocked' : 'waiting';
    let reason = ready ? 'Dependencies satisfied.' : 'Waiting for required dependencies.';
    if (status === 'blocked') reason = 'A required dependency failed or is blocked.';
    const attempt = node.attempts.at(-1);
    if (attempt) {
      const effective = effectiveStatus(attempt, limits.timeoutMs);
      if (['running', 'succeeded'].includes(effective)) {
        status = effective;
        reason = effective === 'running' ? 'Attempt is in progress.' : 'Source inspection reported success.';
      } else {
        const retry = effective === 'timed-out' || attempt.retryable;
        status = retry && node.attempts.length < limits.maxAttempts ? 'pending' : 'failed';
        reason = effective === 'timed-out' ? 'Attempt exceeded its time budget; the host must stop it before retrying.' : attempt.error;
        if (status === 'failed' && retry) reason += ' Attempt budget exhausted.';
      }
    }
    states.set(node.id, { id: node.id, status, attempts: node.attempts.length, reason });
  }
  const running = [...states.values()].filter((item) => item.status === 'running').length;
  if (running > limits.concurrency) throw new TypeError('Running attempts exceed the concurrency limit.');
  let slots = limits.concurrency - running;
  const ready = [];
  for (const node of input.nodes) {
    const state = states.get(node.id);
    if (state.status !== 'pending') continue;
    if (slots > 0) {
      slots -= 1;
      state.status = 'ready';
      ready.push({ id: node.id, question: node.question, dependsOn: [...node.dependsOn], attempt: node.attempts.length + 1, timeoutMs: limits.timeoutMs });
    } else {
      state.status = 'waiting';
      state.reason = 'Concurrency limit reached.';
    }
  }
  const nodes = input.nodes.map((node) => states.get(node.id));
  const collected = collectClaims(input.nodes, states);
  const finished = nodes.every((node) => ['succeeded', 'failed', 'blocked'].includes(node.status));
  const ok = finished && nodes.every((node) => node.status === 'succeeded')
    && !collected.conflicts.length && !collected.rejected.length && !collected.unresolved.length;
  return { schemaVersion: 1, status: finished ? ok ? 'complete' : 'incomplete' : 'pending', ok, limits, ready, nodes, ...collected };
}
