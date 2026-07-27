#!/usr/bin/env node

import fs from 'node:fs';
import readline from 'node:readline';
import { callTool, TOOL_DEFINITIONS, UnknownToolError } from './tools.mjs';

const SERVER_NAME = 'diago';
const SERVER_VERSION = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
const LATEST_PROTOCOL_VERSION = '2025-11-25';
const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  LATEST_PROTOCOL_VERSION,
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
]);

const instructions = [
  'Use advise_diagram when the best view is unclear.',
  'Inspect relevant code, contracts, tests, configuration, or runtime evidence before recording facts.',
  'Create and review a plan, author Archify JSON, validate it, then render.',
  'Never present assumptions or recommendations as verified behavior.',
  'render_diagram writes only the requested absolute HTML path and requires explicit overwrite permission for an existing artifact.',
].join(' ');

let initialized = false;

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  write({ jsonrpc: '2.0', id, result: value });
}

function error(id, code, message, data) {
  write({
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  });
}

function isRequest(message) {
  return Boolean(message)
    && typeof message === 'object'
    && !Array.isArray(message)
    && message.jsonrpc === '2.0'
    && typeof message.method === 'string';
}

function handleRequest(message) {
  const { id, method, params = {} } = message;
  const isNotification = id === undefined;

  if (method === 'notifications/initialized') return;
  if (method === 'notifications/cancelled') return;
  if (isNotification) return;

  if (method === 'initialize') {
    const requestedVersion = params?.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion)
      ? requestedVersion
      : LATEST_PROTOCOL_VERSION;
    initialized = true;
    result(id, {
      protocolVersion,
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Evidence-grounded software engineering diagram planning, review, validation, and rendering.',
      },
      instructions,
    });
    return;
  }

  if (!initialized) {
    error(id, -32002, 'Server not initialized.');
    return;
  }

  if (method === 'ping') {
    result(id, {});
    return;
  }

  if (method === 'tools/list') {
    result(id, { tools: TOOL_DEFINITIONS });
    return;
  }

  if (method === 'tools/call') {
    if (typeof params?.name !== 'string' || !params.name) {
      error(id, -32602, 'tools/call requires a tool name.');
      return;
    }
    try {
      result(id, callTool(params.name, params.arguments ?? {}));
    } catch (toolError) {
      if (toolError instanceof UnknownToolError) {
        error(id, -32602, toolError.message);
        return;
      }
      error(id, -32603, 'Tool execution failed.', toolError.message);
    }
    return;
  }

  error(id, -32601, `Method not found: ${method}`);
}

const lines = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

for await (const line of lines) {
  if (!line.trim()) continue;
  let message;
  try {
    message = JSON.parse(line);
  } catch (parseError) {
    error(null, -32700, 'Parse error.', parseError.message);
    continue;
  }

  if (!isRequest(message)) {
    error(message?.id, -32600, 'Invalid Request.');
    continue;
  }

  handleRequest(message);
}
