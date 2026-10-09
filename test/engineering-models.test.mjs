import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { renderDiagramDocument, validateDiagramDocument } from '../lib/renderer-registry.mjs';
import { dependencyLayout } from '../lib/renderers/dependency.mjs';
import { callTool } from '../mcp/tools.mjs';
import { createPlan } from '../lib/planner.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { fromRoot } from '../lib/paths.mjs';

const examples = { dependency: 'checkout.dependency.json', 'security-matrix': 'platform.security-matrix.json', fishbone: 'latency.fishbone.json' };
const read = type => JSON.parse(fs.readFileSync(fromRoot('examples', examples[type]), 'utf8'));
const validate = (type, diagram) => validateDiagramDocument({ type, diagram });

for (const [type, file] of Object.entries(examples)) {
  test(`${type}: CLI/MCP delivery, escaping, bounded inputs, deterministic receipts`, () => {
    const diagram = read(type);
    diagram.meta.title = '<script>alert(1)</script>';
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-engineering-'));
    try {
      const outputPath = path.join(directory, 'diagram.html');
      const first = renderDiagramDocument({ type, diagram, outputPath });
      const html = fs.readFileSync(outputPath, 'utf8');
      assert.equal(first.artifact.sha256, createHash('sha256').update(html).digest('hex'));
      assert.equal(first.artifact.sha256, renderDiagramDocument({ type, diagram, outputPath }).artifact.sha256);
      assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
      assert.match(html, /&lt;script&gt;/);
      assert.match(html, /engineering-table/);
      assert.match(html, /diagram-mobile/);
      assert.match(html, /diago-theme-thumb/);
      assert.match(html, /prefers-reduced-motion/);
      const mcp = callTool('render_diagram', { type, diagram, outputPath: path.join(directory, 'mcp.html') });
      assert.equal(mcp.isError, false, mcp.content[0].text);
      assert.equal(mcp.structuredContent.artifact.sha256, first.artifact.sha256);
      const cli = spawnSync(process.execPath, [fromRoot('bin/diago.mjs'), 'deliver', type, fromRoot('examples', file), path.join(directory, 'cli.html'), '--json'], { encoding: 'utf8' });
      assert.equal(cli.status, 0, cli.stderr);
      assert.equal(JSON.parse(cli.stdout).ok, true);
      assert.throws(() => validate(type, { ...diagram, surprise: true }), /unknown property/);
      diagram.meta.subtitle = {};
      assert.throws(() => validate(type, diagram), /meta.subtitle/);
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });
}

for (const [type, task] of [
  ['dependency', 'Show a dependency graph with shared dependency and circular imports'],
  ['security-matrix', 'Review RBAC role permissions in an access matrix'],
  ['fishbone', 'Show incident causes as a fishbone root cause analysis'],
]) test(`${type}: advice, schema-v2 plan, and review support`, () => {
  const plan = createPlan(task);
  assert.equal(plan.selection.renderer, type);
  assert.equal(reviewPlan(plan).ok, true);
  for (const file of ['diagram-plan', 'advice']) {
    assert.ok(fs.readFileSync(fromRoot('schemas', `${file}.schema.json`), 'utf8').includes(`"${type}"`));
  }
});

test('dependency computes shared fan-in and real cycles without inventing a root', () => {
  const diagram = read('dependency');
  const result = validate('dependency', diagram);
  assert.equal(result.composition.metrics.cycles, 1);
  assert.equal(result.composition.metrics.ranks, 4);
  const layout = dependencyLayout(diagram);
  assert.equal(layout.cyclic({ from: 'orders', to: 'billing' }), true);
  assert.equal(layout.cyclic({ from: 'orders', to: 'contracts' }), false);
  diagram.edges = [];
  assert.equal(validate('dependency', diagram).composition.metrics.cycles, 0);
  assert.equal(dependencyLayout(diagram).rankCount, 1);
});

test('dependency rejects unknown endpoints, duplicates, self loops, and deep graphs', () => {
  for (const [mutate, error] of [
    [d => { d.edges[0].to = 'missing'; }, /unknown reference/],
    [d => d.edges.push(d.edges[0]), /duplicate pair/],
    [d => { d.edges[0].to = d.edges[0].from; }, /self dependency/],
    [d => { d.nodes[0].label = 'x'.repeat(49); }, /48 characters/],
    [d => { d.nodes[0] = null; }, /nodes\[0\]/],
    [d => { d.edges = d.nodes.slice(1).map((n, i) => ({ ...d.edges[0], from: d.nodes[i].id, to: n.id })); }, /4 dependency ranks/],
  ]) { const d = read('dependency'); mutate(d); assert.throws(() => validate('dependency', d), error); }
});

test('matrix treats missing permissions as unknown and rejects conflicting cells', () => {
  const diagram = read('security-matrix');
  assert.equal(validate('security-matrix', diagram).composition.metrics.unknown, 1);
  diagram.permissions = [];
  assert.equal(validate('security-matrix', diagram).composition.metrics.unknown, 12);
  for (const [mutate, error] of [
    [d => d.permissions.push(d.permissions[0]), /duplicate pair/],
    [d => { d.permissions[0].role = 'missing'; }, /unknown reference/],
    [d => { d.permissions[0].level = 'allow'; }, /must be one of/],
    [d => { delete d.permissions[0].evidence; }, /evidence/],
  ]) { const d = read('security-matrix'); mutate(d); assert.throws(() => validate('security-matrix', d), error); }
});

test('fishbone allows open investigation and multiple evidenced contributors', () => {
  const diagram = read('fishbone');
  assert.equal(validate('fishbone', diagram).composition.metrics.confirmed, 2);
  for (const category of diagram.categories) for (const cause of category.causes) cause.status = 'hypothesis';
  assert.equal(validate('fishbone', diagram).composition.metrics.confirmed, 0);
  delete diagram.categories[0].causes[0].evidence;
  assert.throws(() => validate('fishbone', diagram), /evidence/);
});

test('new models reject oversized inputs and empty cause categories', () => {
  for (const [type, key, max] of [['dependency', 'nodes', 9], ['security-matrix', 'roles', 6], ['fishbone', 'categories', 6]]) {
    const diagram = read(type); diagram[key] = Array.from({ length: max + 1 }, (_, i) => ({ ...diagram[key][0], id: `item${i}` }));
    assert.throws(() => validate(type, diagram), /overview-detail/);
  }
  const diagram = read('fishbone'); diagram.categories[0].causes = [];
  assert.throws(() => validate('fishbone', diagram), /at least 1/);
});

test('only dependency graphs advertise directed walkthrough edges', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-semantics-'));
  try {
    for (const type of Object.keys(examples)) {
      const outputPath = path.join(directory, `${type}.html`);
      renderDiagramDocument({ type, diagram: read(type), outputPath });
      const html = fs.readFileSync(outputPath, 'utf8');
      const graphs = [...html.matchAll(/<svg class="diagram-view[^>]*>([\s\S]*?)<\/svg>/g)].map(m => m[1]);
      assert.equal(graphs.length, 2);
      for (const svg of graphs) {
        const ids = [...svg.matchAll(/data-node-id="([^"]+)"/g)].map(m => m[1]);
        const edges = [...svg.matchAll(/data-edge-from="([^"]+)" data-edge-to="([^"]+)"/g)];
        assert.equal(edges.length, type === 'dependency' ? read(type).edges.length : 0);
        assert.equal(new Set(ids).size, ids.length);
        for (const [, from, to] of edges) { assert.ok(ids.includes(from)); assert.ok(ids.includes(to)); }
        if (type === 'security-matrix') { assert.match(svg, /Unknown/); assert.doesNotMatch(svg, /marker-end=/); }
      }
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('published source previews match deterministic rendering', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-model-previews-'));
  try {
    for (const type of Object.keys(examples)) {
      const outputPath = path.join(directory, `${type}.html`);
      renderDiagramDocument({ type, diagram: read(type), outputPath });
      assert.equal(fs.readFileSync(fromRoot('docs/models', `${type}.html`), 'utf8'), fs.readFileSync(outputPath, 'utf8'), 'Regenerate with scripts/render-engineering-preview.mjs');
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
