#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runArchify } from '../lib/archify.mjs';
import { parseContextArgs, parseNativeOptions } from '../lib/cli-options.mjs';
import { DIAGRAM_TYPES, getDiagramType, listDiagramTypes } from '../lib/diagram-catalog.mjs';
import { createPlan } from '../lib/planner.mjs';
import { advise, formatAdvice } from '../lib/recommender.mjs';
import {
  renderDiagramDocument,
  runRendererCommand,
  validateDiagramDocument,
} from '../lib/renderer-registry.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { fromRoot } from '../lib/paths.mjs';

const [command, ...rawArgs] = process.argv.slice(2);

function usage() {
  return `Diago

Usage:
  diago types [--json]
  diago advise <task or feature> [--source kind] [--audience detail] [--destination label] [--json]
  diago plan <task or feature> [--source kind] [--audience detail] [--destination label] [--out diagram-plan.json]
  diago review <diagram-plan.json> [--json]
  diago render <type> <input.json> [output.html] [renderer options]
  diago validate <type> <input.json> [renderer options]
  diago doctor [--json]
  diago examples

Types: ${DIAGRAM_TYPES.join(', ')}
`;
}

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  } catch (error) {
    fail(`Could not read JSON from "${file}": ${error.message}`);
  }
}

function parseCliInput(callback) {
  try {
    return callback();
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Could not parse command options.');
  }
}

function commandTypes(args) {
  const unknown = args.filter((arg) => arg !== '--json');
  if (unknown.length) fail(`Unknown option "${unknown[0]}".`);
  const catalog = { schemaVersion: 1, types: listDiagramTypes() };
  if (args.includes('--json')) console.log(JSON.stringify(catalog, null, 2));
  else {
    for (const renderer of catalog.types) {
      console.log(`${renderer.type} · ${renderer.question}`);
      console.log(`  Profiles: ${renderer.profiles.join(', ')}`);
    }
  }
}

function commandAdvise(args) {
  const parsed = parseCliInput(() => parseContextArgs(args));
  const query = parsed.positional.join(' ').trim();
  if (!query) fail(usage());
  try {
    const result = advise(query, parsed.context);
    console.log(parsed.json ? JSON.stringify(result, null, 2) : formatAdvice(result));
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Could not create diagram advice.');
  }
}

function commandPlan(args) {
  const parsed = parseCliInput(() => parseContextArgs(args, { allowOutput: true }));
  const task = parsed.positional.join(' ').trim();
  if (!task) fail(usage());
  let plan;
  try {
    plan = createPlan(task, parsed.context);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Could not create diagram plan.');
  }
  const serialized = `${JSON.stringify(plan, null, 2)}\n`;
  if (parsed.output) {
    const outputPath = path.resolve(parsed.output);
    fs.writeFileSync(outputPath, serialized);
    console.log(`Created ${outputPath}`);
  } else {
    process.stdout.write(serialized);
  }
}

function commandReview(args) {
  const json = args.includes('--json');
  const file = args.find((arg) => arg !== '--json');
  if (!file) fail(usage());
  const result = reviewPlan(readJson(file));
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.ok ? 'PASS' : 'NEEDS WORK'} · ${result.score}/100`);
    for (const item of result.findings) {
      console.log(`- ${item.severity.toUpperCase()} ${item.path}: ${item.message}`);
    }
  }
  if (!result.ok) process.exitCode = 1;
}

function commandDoctor(args) {
  const checks = [
    { name: 'node', ok: Number(process.versions.node.split('.')[0]) >= 18, detail: `Node ${process.versions.node}` },
    { name: 'archify-runtime', ok: fs.existsSync(fromRoot('vendor', 'archify', 'bin', 'archify.mjs')), detail: 'Bundled Archify CLI' },
    { name: 'renderer-catalog', ok: listDiagramTypes().length === 8, detail: 'Eight native engineering types' },
    { name: 'codex-plugin', ok: fs.existsSync(fromRoot('.codex-plugin', 'plugin.json')), detail: 'Codex plugin manifest' },
    { name: 'claude-plugin', ok: fs.existsSync(fromRoot('.claude-plugin', 'plugin.json')), detail: 'Claude plugin manifest' },
    { name: 'mcp-server', ok: fs.existsSync(fromRoot('mcp', 'server.mjs')), detail: 'Bundled stdio MCP tools' },
    { name: 'upstream-lock', ok: fs.existsSync(fromRoot('vendor', 'upstreams.lock.json')), detail: 'Pinned upstream sources' },
  ];
  const result = { ok: checks.every((check) => check.ok), checks };
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else for (const check of checks) console.log(`${check.ok ? '✓' : '✗'} ${check.name} — ${check.detail}`);
  if (!result.ok) process.exitCode = 1;
}

function commandExamples() {
  for (const file of fs.readdirSync(fromRoot('examples')).sort()) console.log(file);
}

function commandNativeRenderer(name, type, args) {
  const parsed = parseNativeOptions(args);
  const [inputPath, outputPath] = parsed.positional;
  if (!inputPath) fail(usage());
  const diagram = readJson(inputPath);
  if (name === 'validate') {
    const validation = validateDiagramDocument({ type, diagram, quality: parsed.quality });
    if (parsed.json) console.log(JSON.stringify(validation, null, 2));
    else console.log(`PASS · ${type} · ${validation.checks.length} checks`);
    return;
  }
  if (!['render', 'deliver'].includes(name)) {
    fail(`Native renderer "${type}" supports validate, render, and deliver.`, 1);
  }
  if (!outputPath) fail(`${name} requires an output .html path.`);
  const receipt = renderDiagramDocument({
    type,
    diagram,
    outputPath: path.resolve(outputPath),
    quality: parsed.quality,
  });
  if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
  else console.log(`Rendered ${type} diagram to ${receipt.output}. SHA-256: ${receipt.artifact.sha256}`);
}

function commandRenderer(name, args) {
  const [type, ...rendererArgs] = args;
  if (!type) fail(usage());
  let renderer;
  try {
    renderer = getDiagramType(type);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Unknown renderer type.');
  }
  if (renderer.engine === 'native') {
    try {
      commandNativeRenderer(name, type, rendererArgs);
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Native renderer command failed.', 1);
    }
    return;
  }
  let result;
  try {
    result = runRendererCommand(name, type, rendererArgs);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Renderer command failed.', 1);
  }
  if (result.error) fail(result.error.message, 1);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

switch (command) {
  case 'types': commandTypes(rawArgs); break;
  case 'advise': commandAdvise(rawArgs); break;
  case 'plan': commandPlan(rawArgs); break;
  case 'review': commandReview(rawArgs); break;
  case 'render':
  case 'validate':
  case 'deliver':
  case 'inspect': commandRenderer(command, rawArgs); break;
  case 'guide': {
    const result = runArchify(['guide', ...rawArgs]);
    if (result.error) fail(result.error.message, 1);
    if (result.status !== 0) process.exit(result.status ?? 1);
    break;
  }
  case 'doctor': commandDoctor(rawArgs); break;
  case 'examples': commandExamples(); break;
  case '--help':
  case '-h':
  case 'help':
  case undefined: console.log(usage()); break;
  default: fail(`Unknown command "${command}".\n\n${usage()}`);
}
