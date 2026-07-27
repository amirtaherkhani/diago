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
