#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runArchify } from '../lib/archify.mjs';
import { createPlan } from '../lib/planner.mjs';
import { advise, formatAdvice } from '../lib/recommender.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { fromRoot } from '../lib/paths.mjs';

const [command, ...rawArgs] = process.argv.slice(2);

function usage() {
  return `Diago

Usage:
  diago advise <task or feature> [--json]
  diago plan <task or feature> [--out diagram-plan.json]
  diago review <diagram-plan.json> [--json]
  diago render <type> <input.json> [output.html] [Archify options]
  diago validate <type> <input.json> [Archify options]
  diago doctor [--json]
  diago examples

Types: architecture, workflow, sequence, dataflow, lifecycle
`;
}

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

function parseOutput(args) {
  const outputIndex = args.indexOf('--out');
  if (outputIndex === -1) return { args, output: null };
  if (!args[outputIndex + 1]) fail('--out requires a file path.');
  return {
    args: args.filter((_, index) => index !== outputIndex && index !== outputIndex + 1),
    output: args[outputIndex + 1],
  };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  } catch (error) {
    fail(`Could not read JSON from "${file}": ${error.message}`);
  }
}

function commandAdvise(args) {
  const json = args.includes('--json');
  const query = args.filter((arg) => arg !== '--json').join(' ').trim();
  if (!query) fail(usage());
  const result = advise(query);
  console.log(json ? JSON.stringify(result, null, 2) : formatAdvice(result));
}

function commandPlan(args) {
  const parsed = parseOutput(args);
  const task = parsed.args.join(' ').trim();
  if (!task) fail(usage());
  const output = `${JSON.stringify(createPlan(task), null, 2)}\n`;
  if (parsed.output) {
    fs.writeFileSync(path.resolve(parsed.output), output);
    console.log(`Created ${path.resolve(parsed.output)}`);
  } else {
    process.stdout.write(output);
  }
}

function commandReview(args) {
  const json = args.includes('--json');
  const file = args.find((arg) => arg !== '--json');
  if (!file) fail(usage());
  const result = reviewPlan(readJson(file));
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`${result.ok ? 'PASS' : 'NEEDS WORK'} · ${result.score}/100`);
    for (const item of result.findings) {
      console.log(`- ${item.severity.toUpperCase()} ${item.path}: ${item.message}`);
    }
  }
  if (!result.ok) process.exitCode = 1;
}

function commandDoctor(args) {
  const checks = [
    {
      name: 'node',
      ok: Number(process.versions.node.split('.')[0]) >= 18,
      detail: `Node ${process.versions.node}`,
    },
    {
      name: 'archify-runtime',
      ok: fs.existsSync(fromRoot('vendor', 'archify', 'bin', 'archify.mjs')),
      detail: 'Bundled Archify CLI',
    },
    {
      name: 'codex-plugin',
      ok: fs.existsSync(fromRoot('.codex-plugin', 'plugin.json')),
      detail: 'Codex plugin manifest',
    },
    {
      name: 'claude-plugin',
      ok: fs.existsSync(fromRoot('.claude-plugin', 'plugin.json')),
      detail: 'Claude plugin manifest',
    },
    {
      name: 'mcp-server',
      ok: fs.existsSync(fromRoot('mcp', 'server.mjs')),
      detail: 'Bundled stdio MCP tools',
    },
    {
      name: 'upstream-lock',
      ok: fs.existsSync(fromRoot('vendor', 'upstreams.lock.json')),
      detail: 'Pinned upstream sources',
    },
  ];
  const result = { ok: checks.every((check) => check.ok), checks };

  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    for (const check of checks) {
      console.log(`${check.ok ? '✓' : '✗'} ${check.name} — ${check.detail}`);
    }
  }
  if (!result.ok) process.exitCode = 1;
}

function commandExamples() {
  for (const file of fs.readdirSync(fromRoot('examples')).sort()) {
    console.log(file);
  }
}

function commandArchify(name, args) {
  const result = runArchify([name, ...args]);
  if (result.error) fail(result.error.message, 1);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

switch (command) {
  case 'advise':
    commandAdvise(rawArgs);
    break;
  case 'plan':
    commandPlan(rawArgs);
    break;
  case 'review':
    commandReview(rawArgs);
    break;
  case 'render':
  case 'validate':
  case 'deliver':
  case 'inspect':
  case 'guide':
    commandArchify(command, rawArgs);
    break;
  case 'doctor':
    commandDoctor(rawArgs);
    break;
  case 'examples':
    commandExamples();
    break;
  case '--help':
  case '-h':
  case 'help':
  case undefined:
    console.log(usage());
    break;
  default:
    fail(`Unknown command "${command}".\n\n${usage()}`);
}
