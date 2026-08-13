import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import test from 'node:test';
import { fromRoot } from '../lib/paths.mjs';

const server = fromRoot('mcp', 'server.mjs');
const mcpConfig = JSON.parse(fs.readFileSync(fromRoot('.mcp.json'), 'utf8'))
  .mcpServers['engineering-diagrams'];

test('stdio MCP server negotiates, lists tools, and returns protocol errors', () => {
  // Given a client that exercises initialization and tool dispatch boundaries
  const messages = [
    { jsonrpc: '2.0', id: 0, method: 'tools/list', params: {} },
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
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
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

  // When the requests cross the real stdio process boundary
  const processResult = spawnSync(process.execPath, [server], {
    input: `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`,
    encoding: 'utf8',
  });
  const responses = processResult.stdout
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));

  // Then initialization, dispatch, and protocol failures stay spec-shaped
  assert.equal(processResult.status, 0, processResult.stderr);
  assert.equal(responses.length, 5);
  assert.equal(responses[0].error.code, -32002);
  assert.equal(responses[1].result.protocolVersion, '2025-11-25');
  assert.equal(responses[1].result.serverInfo.version, '0.4.0');
  assert.equal(responses[2].result.tools.length, 6);
  assert.equal(responses[3].result.structuredContent.views[0].type, 'sequence');
  assert.equal(responses[4].error.code, -32602);
});

test('portable MCP launcher resolves Codex and Claude plugin roots', () => {
  // Given the same initialization request from both supported plugin hosts
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

  // When Codex and Claude resolve the portable launcher from different roots
  const codexLaunch = spawnSync(mcpConfig.command, mcpConfig.args, {
    cwd: fromRoot(),
    input: `${initialize}\n`,
    encoding: 'utf8',
  });
  const claudeLaunch = spawnSync(mcpConfig.command, mcpConfig.args, {
    cwd: os.tmpdir(),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: fromRoot() },
    input: `${initialize}\n`,
    encoding: 'utf8',
  });

  // Then both hosts start the same Diago server successfully
  assert.equal(codexLaunch.status, 0, codexLaunch.stderr);
  assert.equal(JSON.parse(codexLaunch.stdout).result.serverInfo.name, 'diago');
  assert.equal(claudeLaunch.status, 0, claudeLaunch.stderr);
  assert.equal(JSON.parse(claudeLaunch.stdout).result.serverInfo.name, 'diago');
});
