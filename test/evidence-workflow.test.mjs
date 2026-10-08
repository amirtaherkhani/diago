import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { planEvidenceWorkflow } from '../lib/evidence-workflow.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { createPlan } from '../lib/planner.mjs';
import { callTool, TOOL_DEFINITIONS } from '../mcp/tools.mjs';
import { fromRoot } from '../lib/paths.mjs';

const claim = (overrides = {}) => ({ id: 'order-write', statement: 'The API persists an order.', source: 'src/orders.mjs:12', verdict: 'supported', reason: 'The repository call is visible in the handler.', ...overrides });
const success = (claims = [claim()]) => ({ status: 'succeeded', elapsedMs: 10, claims });
const failure = (retryable = true) => ({ status: 'failed', elapsedMs: 10, error: 'Source lookup failed.', retryable });
const node = (id, dependsOn = [], attempts = []) => ({ id, question: `Inspect evidence for ${id}.`, dependsOn, attempts });
const workflow = (nodes, options = {}) => ({ schemaVersion: 1, nodes, ...options });

function status(result, id) { return result.nodes.find((item) => item.id === id).status; }

test('diamond releases independent work first and the join only after both dependencies succeed', () => {
  const input = workflow([node('api'), node('storage'), node('verify', ['api', 'storage'])]);
  assert.deepEqual(planEvidenceWorkflow(input).ready.map((item) => item.id), ['api', 'storage']);
  input.nodes[0].attempts.push(success());
  assert.equal(status(planEvidenceWorkflow(input), 'verify'), 'waiting');
  input.nodes[1].attempts.push(success([claim({ id: 'storage-write', statement: 'Orders are stored in PostgreSQL.', source: 'schema.sql:10' })]));
  assert.deepEqual(planEvidenceWorkflow(input).ready.map((item) => item.id), ['verify']);
  input.nodes[2].attempts.push(success([claim({ id: 'contract-match', statement: 'The write matches the storage contract.' })]));
  assert.equal(planEvidenceWorkflow(input).status, 'complete');
  assert.deepEqual(planEvidenceWorkflow(input).ready, []);
});

test('one completed branch unlocks downstream work without waiting for unrelated running work', () => {
  const result = planEvidenceWorkflow(workflow([
    node('done', [], [success()]), node('slow', [], [{ status: 'running', elapsedMs: 100 }]),
    node('next', ['done']), node('other'),
  ], { concurrency: 2 }));
  assert.deepEqual(result.ready.map((item) => item.id), ['next']);
  assert.equal(status(result, 'other'), 'waiting');
  assert.equal(status(result, 'slow'), 'running');
});

test('permanent failures block only dependent nodes and retain unrelated evidence', () => {
  const result = planEvidenceWorkflow(workflow([
    node('failed', [], [failure(false)]), node('child', ['failed']), node('grandchild', ['child']),
    node('good', [], [success()]), node('independent'),
  ]));
  assert.equal(status(result, 'child'), 'blocked');
  assert.equal(status(result, 'grandchild'), 'blocked');
  assert.equal(status(result, 'independent'), 'ready');
  assert.equal(result.evidence.facts.length, 1);
});

test('retries only failed work and stops at the configured attempt budget', () => {
  const input = workflow([node('retry', [], [failure()]), node('done', [], [success()])]);
  assert.equal(planEvidenceWorkflow(input).ready[0].attempt, 2);
  input.nodes[0].attempts.push(failure());
  const result = planEvidenceWorkflow(input);
  assert.equal(result.status, 'incomplete');
  assert.equal(result.ok, false);
  assert.deepEqual(result.ready, []);
  assert.equal(result.evidence.facts.length, 1);
});

test('elapsed time expires running attempts and late success cannot promote claims', () => {
  for (const attempt of [{ status: 'running', elapsedMs: 100 }, { ...success(), elapsedMs: 100 }]) {
    const result = planEvidenceWorkflow(workflow([node('slow', [], [attempt])], { timeoutMs: 100 }));
    assert.equal(result.ready[0].attempt, 2);
    assert.equal(result.evidence.facts.length, 0);
    assert.match(result.nodes[0].reason, /host must stop/);
  }
});

test('conflicting and rejected reports never become facts; uncertainty remains explicit', () => {
  const result = planEvidenceWorkflow(workflow([
    node('supported', [], [success()]),
    node('critic', [], [success([claim({ verdict: 'contradicted', source: 'test/orders.mjs:20' })])]),
    node('uncertain', [], [success([claim({ id: 'cache', verdict: 'unverified', statement: 'The order uses a cache layer.' })])]),
    node('rejected', [], [success([claim({ id: 'queue', verdict: 'contradicted', statement: 'The order is written through a queue.' })])]),
  ]));
  assert.equal(result.evidence.facts.length, 0);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.evidence.assumptions.length, 1);
  assert.equal(result.status, 'incomplete');
});

test('reused claim IDs with different statements are conflicts even when both report support', () => {
  const result = planEvidenceWorkflow(workflow([
    node('first', [], [success()]), node('second', [], [success([claim({ statement: 'The API does not persist an order.' })])]),
  ]));
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.evidence.facts.length, 0);
});

test('deduplicates identical citations, preserves distinct sources, and produces plan-compatible evidence', () => {
  const input = workflow([
    node('first', [], [success()]), node('duplicate', [], [success()]),
    node('second-source', [], [success([claim({ source: 'test/orders.mjs:20' })])]),
  ]);
  const original = structuredClone(input);
  const result = planEvidenceWorkflow(input);
  assert.deepEqual(input, original);
  assert.deepEqual(result, planEvidenceWorkflow(input));
  assert.equal(result.evidence.facts.length, 2);
  const plan = createPlan('Trace the API order write path');
  plan.evidence = result.evidence;
  assert.equal(reviewPlan(plan).ok, true);
});

test('rejects cycles, duplicate IDs, unknown dependencies, and impossible execution history', () => {
  for (const nodes of [
    [node('self', ['self'])], [node('a', ['b']), node('b', ['a'])],
    [node('same'), node('same')], [node('unknown', ['missing'])],
    [node('waiting'), node('early', ['waiting'], [success()])],
    [node('again', [], [success(), failure()])],
    [node('permanent', [], [failure(false), success()])],
  ]) assert.throws(() => planEvidenceWorkflow(workflow(nodes)), TypeError);
});

test('validates limits, malformed claim IDs, public labels, and unsupported fields', () => {
  for (const options of [{ concurrency: 5 }, { concurrency: null }, { maxAttempts: 4 }, { timeoutMs: 0 }, { schemaVersion: 2 }, { extra: true }]) {
    assert.throws(() => planEvidenceWorkflow(workflow([node('one')], options)), TypeError);
  }
  for (const badClaim of [claim({ id: undefined }), claim({ source: '/Users/alice/private.txt' }), claim({ source: 'token=secret-value' }), claim({ verdict: 'trusted' })]) {
    assert.throws(() => planEvidenceWorkflow(workflow([node('one', [], [success([badClaim])])])), TypeError);
  }
  assert.throws(() => planEvidenceWorkflow(workflow([node('a', [], [{ status: 'running', elapsedMs: 1 }]), node('b', [], [{ status: 'running', elapsedMs: 1 }])], { concurrency: 1 })), /concurrency limit/);
  assert.throws(() => planEvidenceWorkflow(workflow([node('a', [], [failure(), failure(), failure()])])), /at most 2/);
});

test('MCP exposes a read-only planner with CLI-equivalent output and rejects unknown arguments', () => {
  const input = workflow([node('api'), node('database')]);
  const tool = TOOL_DEFINITIONS.find((item) => item.name === 'plan_evidence_workflow');
  assert.equal(tool.annotations.readOnlyHint, true);
  const result = callTool(tool.name, { workflow: input });
  assert.equal(result.isError, false);
  assert.deepEqual(result.structuredContent, planEvidenceWorkflow(input));
  assert.equal(callTool(tool.name, { workflow: input, run: true }).isError, true);
  assert.equal(callTool(tool.name, { workflow: workflow([node('cycle', ['cycle'])]) }).isError, true);
});

test('CLI distinguishes pending, complete, incomplete, and invalid workflows without modifying input', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-evidence-'));
  try {
    const file = path.join(directory, 'workflow.json');
    for (const [input, exitCode, expected] of [
      [workflow([node('api')]), 0, 'pending'],
      [workflow([node('api', [], [success()])]), 0, 'complete'],
      [workflow([node('api', [], [failure(false)])]), 1, 'incomplete'],
      [workflow([node('api', ['missing'])]), 2, null],
    ]) {
      const serialized = JSON.stringify(input);
      fs.writeFileSync(file, serialized);
      const result = spawnSync(process.execPath, [fromRoot('bin/diago.mjs'), 'evidence', file, '--json'], { encoding: 'utf8' });
      assert.equal(result.status, exitCode, result.stderr);
      if (expected) assert.equal(JSON.parse(result.stdout).status, expected);
      assert.equal(fs.readFileSync(file, 'utf8'), serialized);
    }
  } finally { fs.rmSync(directory, { recursive: true }); }
});

test('stdio clients can call the new tool through normal protocol dispatch', () => {
  const messages = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'workflow-test', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'plan_evidence_workflow', arguments: { workflow: workflow([node('one')]) } } },
  ];
  const result = spawnSync(process.execPath, [fromRoot('mcp/server.mjs')], { encoding: 'utf8', input: messages.map((item) => JSON.stringify(item)).join('\n') + '\n' });
  assert.equal(result.status, 0, result.stderr);
  const responses = result.stdout.trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(responses[1].result.structuredContent.ready[0].id, 'one');
});


test('late permanent failures are not converted into retryable timeouts', () => {
  const result = planEvidenceWorkflow(workflow([
    node('source', [], [{ ...failure(false), elapsedMs: 500 }]),
  ], { timeoutMs: 100 }));
  assert.equal(result.status, 'incomplete');
  assert.deepEqual(result.ready, []);
});

test('a supported report does not hide another report that could not verify the same claim', () => {
  const result = planEvidenceWorkflow(workflow([
    node('supported', [], [success()]),
    node('unverified', [], [success([claim({ verdict: 'unverified', source: 'deployment-config' })])]),
  ]));
  assert.equal(result.unresolved[0].reports.length, 2);
  assert.equal(result.evidence.facts.length, 0);
  assert.equal(result.status, 'incomplete');
});
