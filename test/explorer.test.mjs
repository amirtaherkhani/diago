import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateExplorer, buildExplorerHtml, renderExplorer } from '../lib/explorer.mjs';
import { callTool } from '../mcp/tools.mjs';
import { fromRoot } from '../lib/paths.mjs';
const example = () => JSON.parse(fs.readFileSync(fromRoot('examples/diago.architecture-explorer.json'), 'utf8'));

test('explorer validates shared components and reports byte metrics without echoing the model', () => {
  const result = validateExplorer(example());
  assert.equal(result.components, 9);
  assert.equal(result.views, 4);
  assert.equal(result.reusedComponentReferences, 4);
  assert.ok(result.inputBytes < result.expandedInputBytes);
  assert.equal(result.document, undefined);
});

test('explorer rejects invalid references, duplicates, unknown fields, and unsupported evidence status', () => {
  const edits = [
    d => { d.root = 'missing'; },
    d => { d.components[0].id = d.components[1].id; },
    d => { d.components[0].detail = 'missing'; },
    d => { d.components[0].evidence = ['missing']; },
    d => { d.components[0].evidence = []; },
    d => { d.components[0].status = 'assumption'; d.components[0].evidence = null; },
    d => { d.components[0].status = 'fact'; },
    d => { d.views[0].edges[0].to = 'missing'; },
    d => { d.views[0].nodes.push(d.views[0].nodes[0]); },
    d => { d.views[0].edges[0].from = d.views[0].edges[0].to; },
    d => { d.css = 'body{}'; },
  ];
  for (const edit of edits) { const d = example(); edit(d); assert.throws(() => validateExplorer(d), /Explorer:/); }
});

test('all explorer perspectives are checked for cycles and bounded depth', () => {
  const d = example();
  d.components[0].detail = 'overview';
  assert.throws(() => validateExplorer(d), /cycle/);
  const chain = {
    schemaVersion: 1, title: 'Depth', root: 'v0', evidence: [],
    components: Array.from({ length: 7 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}`, status: 'assumption', ...(i < 6 ? { detail: `v${i + 1}` } : {}) })),
    views: Array.from({ length: 7 }, (_, i) => ({ id: `v${i}`, title: `View ${i}`, nodes: [`n${i}`], edges: [] })),
  };
  assert.throws(() => validateExplorer(chain), /depth/);
  chain.components.pop(); chain.views.pop(); delete chain.components[5].detail;
  assert.equal(validateExplorer(chain).ok, true);
  chain.views.push({ id: 'unreached', title: 'Unreached', nodes: ['missing'], edges: [] });
  assert.throws(() => validateExplorer(chain), /unknown reference/);
});

test('explorer rejects oversized views and unused components without forbidding relationship cycles', () => {
  const d = example();
  d.views[0].edges.push({ ...d.views[0].edges[0], from: 'rendering', to: 'cli' });
  assert.equal(validateExplorer(d).ok, true);
  d.components.push({ id: 'unused', label: 'Unused', status: 'assumption' });
  assert.throws(() => validateExplorer(d), /every component/);
  const large = example();
  large.views[0].edges = Array.from({ length: 21 }, () => large.views[0].edges[0]);
  assert.throws(() => validateExplorer(large), /0–20/);
});

test('explorer HTML is deterministic, branded, offline, and escapes embedded user data', () => {
  const d = example();
  d.title = '</title><script>bad()</script>';
  d.components[0].description = '</script><img src=x onerror=bad()>';
  const html = buildExplorerHtml(d);
  assert.equal(html, buildExplorerHtml(d));
  assert.ok(html.includes('Diago interlocking D mark'));
  assert.ok(html.includes('connect-src \'none\''));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>bad()'));
  assert.ok(html.includes('\\u003c/script>'));
  assert.doesNotMatch(html, /<script[^>]+src=/);
  const payload = html.match(/<script id="explorer-data" type="application\/json">(.*?)<\/script>/s)[1];
  assert.deepEqual(JSON.parse(payload), d);
});

test('explorer renderer protects existing files and CLI and MCP share the same output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-explorer-'));
  try {
    const outputPath = path.join(dir, 'explorer.html');
    const result = renderExplorer(example(), outputPath);
    assert.equal(result.artifact.bytes, fs.statSync(outputPath).size);
    assert.throws(() => renderExplorer(example(), outputPath), /EEXIST/);
    assert.equal(callTool('render_explorer', { document: example(), outputPath }).isError, true);
    assert.equal(callTool('render_explorer', { document: example(), outputPath, overwrite: 'yes' }).isError, true);
    const mcp = callTool('render_explorer', { document: example(), outputPath, overwrite: true });
    assert.equal(mcp.isError, false);
    assert.equal(mcp.structuredContent.artifact.sha256, result.artifact.sha256);
    const cli = spawnSync(process.execPath, [fromRoot('bin/diago.mjs'), 'explore', fromRoot('examples/diago.architecture-explorer.json'), outputPath, '--overwrite'], { encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(JSON.parse(cli.stdout).artifact.sha256, result.artifact.sha256);
    assert.ok(mcp.content[0].text.length < 1200);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('explorer MCP preserves configured output-root boundaries', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-explorer-root-'));
  const prior = process.env.DIAGO_OUTPUT_ROOT;
  process.env.DIAGO_OUTPUT_ROOT = dir;
  try {
    const result = callTool('render_explorer', { document: example(), outputPath: path.join(dir, '..', 'escape.html') });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /DIAGO_OUTPUT_ROOT/);
  } finally {
    if (prior === undefined) delete process.env.DIAGO_OUTPUT_ROOT; else process.env.DIAGO_OUTPUT_ROOT = prior;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
