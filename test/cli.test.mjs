import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fromRoot } from '../lib/paths.mjs';

const cli = fromRoot('bin', 'diago.mjs');

function run(args, cwd = fromRoot()) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('doctor verifies the dual plugin, MCP server, and renderer', () => {
  const result = run(['doctor', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const doctor = JSON.parse(result.stdout);
  assert.equal(doctor.ok, true);
  assert.ok(doctor.checks.some((check) => check.name === 'mcp-server' && check.ok));
});

test('types lists all native renderer contracts as JSON', () => {
  // Given the installed deterministic CLI
  // When the native type catalog is requested
  const result = run(['types', '--json']);

  // Then all eight supported engineering renderers are discoverable
  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(result.stdout);
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.types.length, 8);
  assert.equal(catalog.types[5].type, 'data-model');
});

test('plan writes a reusable diagram plan', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-test-'));
  try {
    const output = path.join(temporary, 'plan.json');
    const result = run(['plan', 'Map an async deployment job lifecycle', '--out', output]);
    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(plan.views[0].type, 'lifecycle');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('plan accepts source audience and destination context', () => {
  const result = run([
    'plan',
    'Map the release migration milestones',
    '--source',
    'repository',
    '--audience',
    'executive',
    '--destination',
    'release-review',
  ]);

  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.source.kind, 'repository');
  assert.equal(plan.audience.detail, 'executive');
  assert.equal(plan.output.destination, 'release-review');
});

test('bundled Archify validates and renders the showcase example', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-render-'));
  try {
    const input = fromRoot('examples', 'plugin-request.architecture.json');
    const output = path.join(temporary, 'diagram.html');
    const validation = run(['validate', 'architecture', input, '--quality', 'showcase', '--json']);
    assert.equal(validation.status, 0, validation.stderr);
    assert.equal(JSON.parse(validation.stdout).ok, true);

    const render = run(['render', 'architecture', input, output, '--quality', 'showcase']);
    assert.equal(render.status, 0, render.stderr);
    const html = fs.readFileSync(output, 'utf8');
    assert.match(html, /Diago/);
    assert.match(html, /<svg/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('CLI validates and renders every Diago-owned native example', () => {
  // Given the three Diago-owned renderer examples
  const examples = [
    ['data-model', 'order-domain.data-model.json'],
    ['timeline', 'payment-migration.timeline.json'],
    ['layers', 'checkout-controls.layers.json'],
  ];
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-native-cli-'));

  try {
    for (const [type, file] of examples) {
      // When each example is validated and rendered through the public CLI
      const input = fromRoot('examples', file);
      const output = path.join(temporary, `${type}.html`);
      const validation = run(['validate', type, input, '--json']);
      const render = run(['render', type, input, output]);

      // Then the same native contract is available without MCP
      assert.equal(validation.status, 0, validation.stderr);
      assert.equal(JSON.parse(validation.stdout).ok, true);
      assert.equal(render.status, 0, render.stderr);
      assert.match(fs.readFileSync(output, 'utf8'), /role="img"/);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
