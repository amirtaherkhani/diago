#!/usr/bin/env node

import { randomUUID, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createMcpSession,
  LATEST_PROTOCOL_VERSION,
  SERVER_NAME,
  SERVER_VERSION,
  STREAMABLE_HTTP_PROTOCOL_VERSIONS,
} from './protocol.mjs';

const DEFAULT_PORT = 3000;
const DEFAULT_MAX_BODY_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_SESSIONS = 1_000;
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${name} must be a positive integer.`);
  }
  return parsed;
}

function commaSeparated(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function equalSecrets(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}

function mediaTypes(header) {
  return String(header ?? '')
    .split(',')
    .map((item) => item.split(';', 1)[0].trim().toLowerCase())
    .filter(Boolean);
}

function appendVary(response, value) {
  const existing = response.getHeader('Vary');
  const values = new Set(
    String(existing ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  values.add(value);
  response.setHeader('Vary', [...values].join(', '));
}

function setCorsHeaders(response, origin) {
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, DELETE, OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Accept, Content-Type, MCP-Protocol-Version, MCP-Session-Id',
  );
  response.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id');
  appendVary(response, 'Origin');
}

function authorize(request, response, bearerToken) {
  if (!bearerToken) return true;
  const authorization = request.headers.authorization ?? '';
  if (equalSecrets(authorization, `Bearer ${bearerToken}`)) return true;
  sendHttpError(response, 401, 'A valid bearer token is required.', {
    'WWW-Authenticate': 'Bearer realm="diago-mcp"',
  });
  return false;
}

function serveArtifact(requestUrl, request, response, outputRoot) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendHttpError(response, 405, 'Method not allowed.', { Allow: 'GET, HEAD, OPTIONS' });
    return;
  }
  if (!outputRoot || !fs.existsSync(outputRoot)) {
    sendHttpError(response, 404, 'Artifact storage is not configured.');
    return;
  }

  let relativeArtifactPath;
  try {
    relativeArtifactPath = decodeURIComponent(
      requestUrl.pathname.slice('/artifacts/'.length),
    );
  } catch {
    sendHttpError(response, 400, 'Artifact path is not valid URL encoding.');
    return;
  }

  let canonicalArtifact;
  let stat;
  try {
    const canonicalRoot = fs.realpathSync(outputRoot);
    const candidate = path.resolve(canonicalRoot, relativeArtifactPath);
    const candidateRelative = path.relative(canonicalRoot, candidate);
    if (
      !candidateRelative
      || candidateRelative.startsWith('..')
      || path.isAbsolute(candidateRelative)
      || path.extname(candidate).toLowerCase() !== '.html'
      || !fs.existsSync(candidate)
    ) {
      throw new Error('Artifact path is outside the output root.');
    }

    canonicalArtifact = fs.realpathSync(candidate);
    const canonicalRelative = path.relative(canonicalRoot, canonicalArtifact);
    stat = fs.statSync(canonicalArtifact);
    if (
      canonicalRelative.startsWith('..')
      || path.isAbsolute(canonicalRelative)
      || !stat.isFile()
    ) {
      throw new Error('Artifact is not a regular file inside the output root.');
    }
  } catch {
    sendHttpError(response, 404, 'Artifact was not found.');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': stat.size,
    'Content-Disposition': 'inline',
    'Content-Security-Policy': "sandbox allow-scripts; default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:",
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(canonicalArtifact)
    .on('error', () => response.destroy())
    .pipe(response);
}

function sendJson(response, status, body, headers = {}) {
  const serialized = `${JSON.stringify(body)}\n`;
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(serialized),
    ...headers,
  });
  response.end(serialized);
}

function sendEmpty(response, status, headers = {}) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end();
}

function sendHttpError(response, status, message, headers = {}) {
  sendJson(response, status, {
    error: {
      status,
      message,
    },
  }, headers);
}

function readJsonBody(request, maxBodyBytes) {
  const contentLength = Number(request.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    request.resume();
    throw new HttpError(413, `Request body exceeds the ${maxBodyBytes}-byte limit.`);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;

    request.on('data', (chunk) => {
      if (settled) return;
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        settled = true;
        request.resume();
        reject(new HttpError(413, `Request body exceeds the ${maxBodyBytes}-byte limit.`));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (settled) return;
      settled = true;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Request body must be valid JSON.'));
      }
    });
    request.on('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

export function createHttpServer(options = {}) {
  const allowedOrigins = options.allowedOrigins
    ?? commaSeparated(process.env.DIAGO_ALLOWED_ORIGINS);
  const maxBodyBytes = positiveInteger(
    options.maxBodyBytes ?? process.env.DIAGO_MAX_BODY_BYTES,
    DEFAULT_MAX_BODY_BYTES,
    'DIAGO_MAX_BODY_BYTES',
  );
  const sessionTtlMs = positiveInteger(
    options.sessionTtlMs ?? process.env.DIAGO_SESSION_TTL_MS,
    DEFAULT_SESSION_TTL_MS,
    'DIAGO_SESSION_TTL_MS',
  );
  const maxSessions = positiveInteger(
    options.maxSessions ?? process.env.DIAGO_MAX_SESSIONS,
    DEFAULT_MAX_SESSIONS,
    'DIAGO_MAX_SESSIONS',
  );
  const now = options.now ?? Date.now;
  const bearerToken = options.bearerToken ?? process.env.DIAGO_BEARER_TOKEN;
  const outputRoot = options.outputRoot ?? process.env.DIAGO_OUTPUT_ROOT;
  const sessions = new Map();

  function purgeExpiredSessions() {
    const expiry = now() - sessionTtlMs;
    for (const [id, session] of sessions) {
      if (session.touchedAt <= expiry) sessions.delete(id);
    }
  }

  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://diago.local');

    if (requestUrl.pathname === '/livez' || requestUrl.pathname === '/readyz') {
      if (request.method !== 'GET') {
        sendHttpError(response, 405, 'Method not allowed.', { Allow: 'GET' });
        return;
      }
      sendJson(response, 200, {
        status: 'ok',
        service: SERVER_NAME,
        version: SERVER_VERSION,
      });
      return;
    }

    const isMcpEndpoint = requestUrl.pathname === '/mcp';
    const isArtifactEndpoint = requestUrl.pathname.startsWith('/artifacts/');
    if (!isMcpEndpoint && !isArtifactEndpoint) {
      sendHttpError(response, 404, 'Not found.');
      return;
    }

    const origin = request.headers.origin;
    if (origin) {
      const originAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
      if (!originAllowed) {
        sendHttpError(response, 403, 'Origin is not allowed.');
        return;
      }
      setCorsHeaders(response, origin);
    }

    if (request.method === 'OPTIONS') {
      sendEmpty(response, 204);
      return;
    }

    if (!authorize(request, response, bearerToken)) return;

    if (isArtifactEndpoint) {
      serveArtifact(requestUrl, request, response, outputRoot);
      return;
    }

    if (request.method === 'GET') {
      sendHttpError(response, 405, 'Server-sent event streams are not enabled.', {
        Allow: 'POST, DELETE, OPTIONS',
      });
      return;
    }

    purgeExpiredSessions();
    const sessionId = request.headers['mcp-session-id'];

    if (request.method === 'DELETE') {
      if (!sessionId) {
        sendHttpError(response, 400, 'MCP-Session-Id is required.');
        return;
      }
      if (!sessions.delete(sessionId)) {
        sendHttpError(response, 404, 'MCP session was not found or has expired.');
        return;
      }
      sendEmpty(response, 204);
      return;
    }

    if (request.method !== 'POST') {
      sendHttpError(response, 405, 'Method not allowed.', {
        Allow: 'POST, DELETE, OPTIONS',
      });
      return;
    }

    const contentTypes = mediaTypes(request.headers['content-type']);
    if (!contentTypes.includes('application/json')) {
      sendHttpError(response, 415, 'Content-Type must be application/json.');
      return;
    }

    const accepts = mediaTypes(request.headers.accept);
    if (!accepts.includes('application/json') || !accepts.includes('text/event-stream')) {
      sendHttpError(
        response,
        406,
        'Accept must include application/json and text/event-stream.',
      );
      return;
    }

    let message;
    try {
      message = await readJsonBody(request, maxBodyBytes);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 400;
      sendHttpError(response, status, error.message);
      return;
    }

    if (message?.method === 'initialize') {
      if (message.id === undefined) {
        sendHttpError(response, 400, 'initialize must be a JSON-RPC request, not a notification.');
        return;
      }
      if (sessionId) {
        sendHttpError(response, 400, 'initialize must not include MCP-Session-Id.');
        return;
      }
      if (sessions.size >= maxSessions) {
        sendHttpError(response, 503, 'The MCP session limit has been reached. Retry later.');
        return;
      }

      const protocol = createMcpSession({
        supportedProtocolVersions: STREAMABLE_HTTP_PROTOCOL_VERSIONS,
      });
      const mcpResponse = protocol.handle(message);
      if (!protocol.initialized) {
        sendJson(response, 400, mcpResponse);
        return;
      }
      const newSessionId = randomUUID();
      sessions.set(newSessionId, {
        protocol,
        protocolVersion: protocol.protocolVersion,
        touchedAt: now(),
      });
      sendJson(response, 200, mcpResponse, {
        'MCP-Session-Id': newSessionId,
      });
      return;
    }

    if (!sessionId) {
      sendHttpError(response, 400, 'MCP-Session-Id is required after initialization.');
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      sendHttpError(response, 404, 'MCP session was not found or has expired.');
      return;
    }

    const requestProtocolVersion = request.headers['mcp-protocol-version'];
    if (
      requestProtocolVersion
      && (
        !STREAMABLE_HTTP_PROTOCOL_VERSIONS.has(requestProtocolVersion)
        || requestProtocolVersion !== session.protocolVersion
      )
    ) {
      sendHttpError(
        response,
        400,
        `MCP-Protocol-Version must match the negotiated version ${session.protocolVersion}.`,
      );
      return;
    }

    session.touchedAt = now();
    const mcpResponse = session.protocol.handle(message);
    if (!mcpResponse) {
      sendEmpty(response, 202);
      return;
    }
    sendJson(response, 200, mcpResponse, {
      'MCP-Session-Id': sessionId,
    });
  });
}

const modulePath = fileURLToPath(import.meta.url);
const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === modulePath;

if (isEntryPoint) {
  const host = process.env.HOST || '127.0.0.1';
  const port = positiveInteger(process.env.PORT, DEFAULT_PORT, 'PORT');
  const server = createHttpServer();

  server.listen(port, host, () => {
    process.stdout.write(
      `${SERVER_NAME} MCP Streamable HTTP server ${SERVER_VERSION} listening on http://${host}:${port}/mcp (protocol ${LATEST_PROTOCOL_VERSION})\n`,
    );
  });

  function shutdown(signal) {
    process.stdout.write(`Received ${signal}; stopping Diago MCP HTTP server.\n`);
    server.close((error) => {
      if (error) {
        process.stderr.write(`${error.stack || error.message}\n`);
        process.exitCode = 1;
      }
    });
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}
