import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { callTool, TOOL_DEFINITIONS, UnknownToolError } from '../mcp/tools.mjs';
import { fromRoot } from '../lib/paths.mjs';

const server = fromRoot('mcp', 'server.mjs');
const mcpConfig = JSON.parse(fs.readFileSync(fromRoot('.mcp.json'), 'utf8'))
  .mcpServers['engineering-diagrams'];

function readExample() {
  return JSON.parse(
    fs.readFileSync(fromRoot('examples', 'plugin-request.architecture.json'), 'utf8'),
  );
}

test('MCP handlers advise, plan, and review without writing files', () => {
  assert.equal(TOOL_DEFINITIONS.length, 5);
  assert.ok(TOOL_DEFINITIONS.every((tool) => tool.inputSchema.type === 'object'));

  const advice = callTool('advise_diagram', {
    task: 'Trace an API request and its retry response',
  });
  assert.equal(advice.isError, false);
  assert.equal(advice.structuredContent.recommendation.type, 'sequence');
  assert.equal(callTool('advise_diagram', { task: 'Trace a request', extra: true }).isError, true);

  const plan = callTool('create_diagram_plan', {
    task: 'Trace an API request and its retry response',
  });
  assert.equal(plan.isError, false);
  assert.equal(plan.structuredContent.views[0].type, 'sequence');

  const review = callTool('review_diagram_plan', {
    plan: plan.structuredContent,
  });
  assert.equal(review.isError, false);
  assert.equal(review.structuredContent.ok, true);
  assert.ok(review.structuredContent.findings.some((item) => item.code === 'no-facts'));

  assert.throws(() => callTool('does_not_exist', {}), UnknownToolError);
});

test('MCP validate and render tools use bundled Archify with overwrite protection', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-mcp-test-'));
  try {
    const diagram = readExample();
    const outputPath = path.join(temporary, 'plugin-request.html');

    const validation = callTool('validate_diagram', {
      type: 'architecture',
      diagram,
      quality: 'showcase',
    });
    assert.equal(validation.isError, false, validation.content[0].text);
    assert.equal(validation.structuredContent.ok, true);
    assert.equal(validation.structuredContent.input, '<inline-diagram>');

    const render = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath,
      quality: 'showcase',
    });
    assert.equal(render.isError, false, render.content[0].text);
    assert.equal(render.structuredContent.ok, true);
    assert.match(render.content[0].text, /"sha256"/);
    assert.ok(fs.readFileSync(outputPath, 'utf8').includes('<svg'));

    const protectedRender = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath,
    });
    assert.equal(protectedRender.isError, true);
    assert.match(protectedRender.content[0].text, /Refusing to replace/);

    const overwrite = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath,
      overwrite: true,
    });
    assert.equal(overwrite.isError, false, overwrite.content[0].text);

    const invalidOverwrite = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath: path.join(temporary, 'invalid-overwrite.html'),
      overwrite: 'yes',
    });
    assert.equal(invalidOverwrite.isError, true);
    assert.match(invalidOverwrite.content[0].text, /overwrite must be a boolean/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('stdio MCP server negotiates, lists tools, and returns protocol errors', () => {
  const messages = [
    {
      jsonrpc: '2.0',
      id: 0,
      method: 'tools/list',
      params: {},
    },
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'node-test', version: '1.0.0' },
      },
    },
    {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    },
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_diagram_plan',
        arguments: { task: 'Explain the checkout request flow' },
      },
    },
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'unknown_tool', arguments: {} },
    },
  ];

  const processResult = spawnSync(process.execPath, [server], {
    input: `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`,
    encoding: 'utf8',
  });
  assert.equal(processResult.status, 0, processResult.stderr);

  const responses = processResult.stdout
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(responses.length, 5);
  assert.equal(responses[0].error.code, -32002);
  assert.equal(responses[1].result.protocolVersion, '2025-11-25');
  assert.equal(responses[1].result.serverInfo.version, '0.2.0');
  assert.equal(responses[2].result.tools.length, 5);
  assert.equal(responses[3].result.structuredContent.views[0].type, 'sequence');
  assert.equal(responses[4].error.code, -32602);
});

test('portable MCP launcher resolves Codex and Claude plugin roots', () => {
  const initialize = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'launcher-test', version: '1.0.0' },
    },
  });

  const codexLaunch = spawnSync(mcpConfig.command, mcpConfig.args, {
    cwd: fromRoot(),
    input: `${initialize}\n`,
    encoding: 'utf8',
  });
  assert.equal(codexLaunch.status, 0, codexLaunch.stderr);
  assert.equal(JSON.parse(codexLaunch.stdout).result.serverInfo.name, 'diago');

  const claudeLaunch = spawnSync(mcpConfig.command, mcpConfig.args, {
    cwd: os.tmpdir(),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: fromRoot() },
    input: `${initialize}\n`,
    encoding: 'utf8',
  });
  assert.equal(claudeLaunch.status, 0, claudeLaunch.stderr);
  assert.equal(JSON.parse(claudeLaunch.stdout).result.serverInfo.name, 'diago');
});
