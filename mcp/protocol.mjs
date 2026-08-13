import fs from 'node:fs';
import { callTool, TOOL_DEFINITIONS, UnknownToolError } from './tools.mjs';

export const SERVER_NAME = 'diago';
export const SERVER_VERSION = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
export const LATEST_PROTOCOL_VERSION = '2025-11-25';
export const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  LATEST_PROTOCOL_VERSION,
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
]);
const instructions = [
  'Use list_diagram_types when the native capability or profile is unclear.',
  'Use advise_diagram when the best view is unclear.',
  'Inspect relevant code, contracts, tests, configuration, or runtime evidence before recording facts.',
  'Create and review a schema-v2 plan, author renderer JSON, validate it, then render.',
  'Never present assumptions or recommendations as verified behavior.',
  'render_diagram writes only the requested absolute HTML path and requires explicit overwrite permission for an existing artifact.',
].join(' ');

export function errorResponse(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  };
}

export function isMcpMessage(message) {
  return Boolean(message)
    && typeof message === 'object'
    && !Array.isArray(message)
    && message.jsonrpc === '2.0'
    && typeof message.method === 'string';
}

export function createMcpSession(options = {}) {
  const supportedProtocolVersions = options.supportedProtocolVersions
    ?? SUPPORTED_PROTOCOL_VERSIONS;
  let initialized = false;
  let protocolVersion;

  return {
    get initialized() {
      return initialized;
    },
    get protocolVersion() {
      return protocolVersion;
    },
    handle(message) {
      if (!isMcpMessage(message)) {
        return errorResponse(message?.id, -32600, 'Invalid Request.');
      }

      const { id, method, params = {} } = message;
      const isNotification = id === undefined;

      if (method === 'notifications/initialized') return null;
      if (method === 'notifications/cancelled') return null;
      if (isNotification) return null;

      if (method === 'initialize') {
        const requestedVersion = params?.protocolVersion;
        protocolVersion = supportedProtocolVersions.has(requestedVersion)
          ? requestedVersion
          : LATEST_PROTOCOL_VERSION;
        initialized = true;
        return {
          jsonrpc: '2.0',
          id,
          result: {
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
          },
        };
      }

      if (!initialized) {
        return errorResponse(id, -32002, 'Server not initialized.');
      }

      if (method === 'ping') {
        return { jsonrpc: '2.0', id, result: {} };
      }

      if (method === 'tools/list') {
        return { jsonrpc: '2.0', id, result: { tools: TOOL_DEFINITIONS } };
      }

      if (method === 'tools/call') {
        if (typeof params?.name !== 'string' || !params.name) {
          return errorResponse(id, -32602, 'tools/call requires a tool name.');
        }
        try {
          return {
            jsonrpc: '2.0',
            id,
            result: callTool(params.name, params.arguments ?? {}),
          };
        } catch (toolError) {
          if (toolError instanceof UnknownToolError) {
            return errorResponse(id, -32602, toolError.message);
          }
          return errorResponse(id, -32603, 'Tool execution failed.', toolError.message);
        }
      }

      return errorResponse(id, -32601, `Method not found: ${method}`);
    },
  };
}
