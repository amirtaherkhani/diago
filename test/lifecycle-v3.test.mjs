import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderDiagramDocument, validateDiagramDocument } from '../lib/renderer-registry.mjs';
import { fromRoot } from '../lib/paths.mjs';
import { callTool } from '../mcp/tools.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(fromRoot(relativePath), 'utf8'));
const temporary = callback => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-lifecycle-v3-'));
  try { return callback(directory); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
};

function branchingLifecycle() {
  return {
    schema_version: 3,
    diagram_type: 'lifecycle',
    meta: { title: 'Delivery process', output: 'delivery.html' },
    mainPath: ['queued', 'processing', 'review', 'delivered'],
    states: [
      { id: 'queued', type: 'start', label: 'Queued' },
      { id: 'processing', type: 'active', label: 'Processing' },
      { id: 'review', type: 'decision', label: 'Review' },
      { id: 'delivered', type: 'success', label: 'Delivered' },
      { id: 'rejected', type: 'failure', label: 'Rejected' },
    ],
    transitions: [
      { from: 'queued', to: 'processing', label: 'Start' },
      { from: 'processing', to: 'review', label: 'Ready' },
      { from: 'review', to: 'delivered', label: 'Approve' },
      { from: 'review', to: 'rejected', label: 'Reject' },
      { from: 'rejected', to: 'processing', label: 'Retry', arrow: 'directed' },
    ],
  };
}

test('lifecycle v3 example preserves the v1 example semantics through explicit migration', () => {
  const original = readJson('test/fixtures/lifecycle-v1.json');
  const migrated = readJson('examples/presentation/lifecycle.json');
  assert.equal(original.schema_version, 1);
  assert.equal(migrated.schema_version, 3);
  assert.deepEqual(migrated.mainPath, ['pending', 'delivered']);
  for (const key of ['title', 'output', 'animation']) assert.equal(migrated.meta[key], original.meta[key]);
  assert.equal(migrated.meta.subtitle, original.lanes[0].label);
  assert.deepEqual(migrated.states.map(({ id, type, label }) => ({ id, type, label })),
    original.states.map(({ id, type, label }) => ({ id, type, label })));
  assert.deepEqual(migrated.transitions.map(({ from, to, label }) => ({ from, to, label })),
    original.transitions.map(({ from, to, label }) => ({ from, to, label })));
  assert.ok(migrated.states.every(state => !('lane' in state) && !('col' in state)));
  assert.ok(migrated.transitions.every(transition => !('labelDy' in transition)));
});

test('lifecycle v3 validates and renders its explicit main path, branch, retry loop, and directed arrow', () => temporary(directory => {
  const diagram = branchingLifecycle();
  const before = JSON.stringify(diagram);
  assert.equal(validateDiagramDocument({ type: 'lifecycle', diagram, quality: 'standard' }).ok, true);
  const validation = callTool('validate_diagram', { type: 'lifecycle', diagram, quality: 'standard' });
  assert.equal(validation.isError, false, validation.content?.[0]?.text);
  const outputPath = path.join(directory, 'delivery.html');
  const receipt = renderDiagramDocument({ type: 'lifecycle', diagram, outputPath, quality: 'standard' });
  const html = fs.readFileSync(outputPath, 'utf8');
  assert.equal(receipt.ok, true);
  for (const id of diagram.mainPath) assert.ok(html.includes(`data-node-id="${id}"`), `missing main-path state ${id}`);
  assert.match(html, /data-edge-from="review" data-edge-to="rejected"/);
  assert.match(html, /data-edge-from="rejected" data-edge-to="processing"/);
  assert.match(html, /data-arrow-type="directed"/);
  const toolOutput = path.join(directory, 'delivery-tool.html');
  const rendered = callTool('render_diagram', { type: 'lifecycle', diagram, outputPath: toolOutput, quality: 'standard' });
  assert.equal(rendered.isError, false, rendered.content?.[0]?.text);
  assert.ok(fs.readFileSync(toolOutput, 'utf8').includes('data-edge-from="rejected" data-edge-to="processing"'));
  assert.equal(JSON.stringify(diagram), before);
}));

test('lifecycle rejects v1/v2 documents and missing or invalid mainPath values', () => {
  const legacy = readJson('test/fixtures/lifecycle-v1.json');
  assert.equal(callTool('validate_diagram', { type: 'lifecycle', diagram: legacy }).isError, true);
  const legacyV2 = { ...legacy, schema_version: 2 };
  assert.equal(callTool('validate_diagram', { type: 'lifecycle', diagram: legacyV2 }).isError, true);
  for (const version of [1, 2]) {
    const diagram = branchingLifecycle();
    diagram.schema_version = version;
    assert.throws(() => validateDiagramDocument({ type: 'lifecycle', diagram, quality: 'standard' }), /schema_version|const|must be equal/i);
  }
  const missing = branchingLifecycle();
  delete missing.mainPath;
  assert.throws(() => validateDiagramDocument({ type: 'lifecycle', diagram: missing, quality: 'standard' }), /mainPath|required/i);
  for (const mainPath of [[], ['queued'], ['queued', 'unknown'], ['queued', 'review'], ['queued', 'processing', 'queued']]) {
    const diagram = branchingLifecycle();
    diagram.mainPath = mainPath;
    assert.throws(() => validateDiagramDocument({ type: 'lifecycle', diagram, quality: 'standard' }), /mainPath|transition|state|schema/i);
  }
});

test('lifecycle packaged Spanish catalog renders translated controls with software notices', () => temporary(directory => {
  const diagram = readJson('examples/presentation/lifecycle.json');
  diagram.meta.locale = 'es';
  const outputPath = path.join(directory, 'lifecycle-es.html');
  renderDiagramDocument({ type: 'lifecycle', diagram, outputPath, quality: 'standard' });
  const html = fs.readFileSync(outputPath, 'utf8');
  assert.match(html, /lang="es"/);
  assert.ok(html.includes('estado inicial'), 'expected a translated Spanish lifecycle legend entry');
  const noticesScript = html.match(/<script type="application\/json" id="archify-software-notices">([\s\S]*?)<\/script>/);
  assert.ok(noticesScript, 'expected embedded upstream software notices');
  const notices = JSON.parse(noticesScript[1]);
  for (const file of ['LICENSE', 'LICENSE-MIT', 'NOTICE', 'THIRD_PARTY_NOTICES.md']) {
    const notice = fs.readFileSync(fromRoot('vendor/archify', file), 'utf8').trimEnd();
    assert.ok(notices.includes(`${file}\n${notice}`), `rendered artifact is missing ${file} content`);
  }
  assert.ok(notices.includes('Apache-2.0'));
}));
