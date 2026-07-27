import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createHttpServer } from '../mcp/http-server.mjs';

const mcpHeaders = {
  Accept: 'application/json, text/event-stream',
  'Content-Type': 'application/json',
};

function message(id, method, params = {}) {
  return {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
}

async function post(baseUrl, body, headers = {}) {
  return fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: { ...mcpHeaders, ...headers },
    body: JSON.stringify(body),
  });
}

test('Streamable HTTP MCP transport initializes, uses sessions, and enforces headers', async () => {
  const server = createHttpServer({
    allowedOrigins: ['https://diago.example'],
    sessionTtlMs: 60_000,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${baseUrl}/livez`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: 'ok',
      service: 'diago',
      version: '0.2.0',
    });

    const rejectedOrigin = await post(
      baseUrl,
      message(1, 'initialize', {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'http-test', version: '1.0.0' },
      }),
      { Origin: 'https://untrusted.example' },
    );
    assert.equal(rejectedOrigin.status, 403);

    const initialize = await post(
      baseUrl,
      message(1, 'initialize', {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'http-test', version: '1.0.0' },
      }),
      { Origin: 'https://diago.example' },
    );
    assert.equal(initialize.status, 200);
    assert.equal(initialize.headers.get('access-control-allow-origin'), 'https://diago.example');
    const sessionId = initialize.headers.get('mcp-session-id');
    assert.ok(sessionId);
    assert.equal((await initialize.json()).result.protocolVersion, '2025-11-25');

    const missingSession = await post(baseUrl, message(2, 'tools/list'));
    assert.equal(missingSession.status, 400);

    const wrongVersion = await post(baseUrl, message(2, 'tools/list'), {
      'MCP-Session-Id': sessionId,
      'MCP-Protocol-Version': '2025-06-18',
    });
    assert.equal(wrongVersion.status, 400);

    const list = await post(baseUrl, message(2, 'tools/list'), {
      'MCP-Session-Id': sessionId,
      'MCP-Protocol-Version': '2025-11-25',
    });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).result.tools.length, 5);

    const initializedNotification = await post(
      baseUrl,
      {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      },
      {
        'MCP-Session-Id': sessionId,
        'MCP-Protocol-Version': '2025-11-25',
      },
    );
    assert.equal(initializedNotification.status, 202);
    assert.equal(await initializedNotification.text(), '');

    const eventStream = await fetch(`${baseUrl}/mcp`);
    assert.equal(eventStream.status, 405);

    const terminate = await fetch(`${baseUrl}/mcp`, {
      method: 'DELETE',
      headers: { 'MCP-Session-Id': sessionId },
    });
    assert.equal(terminate.status, 204);

    const expired = await post(baseUrl, message(3, 'ping'), {
      'MCP-Session-Id': sessionId,
      'MCP-Protocol-Version': '2025-11-25',
    });
    assert.equal(expired.status, 404);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('Streamable HTTP MCP transport rejects incompatible media types and oversized bodies', async () => {
  const server = createHttpServer({ maxBodyBytes: 64 });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const wrongContentType = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'text/plain',
      },
      body: '{}',
    });
    assert.equal(wrongContentType.status, 415);

    const missingEventStream = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    assert.equal(missingEventStream.status, 406);

    const tooLarge = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: mcpHeaders,
      body: JSON.stringify({ value: 'x'.repeat(128) }),
    });
    assert.equal(tooLarge.status, 413);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('Streamable HTTP MCP transport protects the MCP endpoint with an optional bearer token', async () => {
  const server = createHttpServer({ bearerToken: 'test-secret' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const initialize = message(1, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'auth-test', version: '1.0.0' },
  });

  try {
    const unauthenticated = await post(baseUrl, initialize);
    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.headers.get('www-authenticate'), 'Bearer realm="diago-mcp"');

    const authenticated = await post(baseUrl, initialize, {
      Authorization: 'Bearer test-secret',
    });
    assert.equal(authenticated.status, 200);
    assert.ok(authenticated.headers.get('mcp-session-id'));
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('Streamable HTTP MCP transport limits sessions and does not allocate invalid initialization', async () => {
  const server = createHttpServer({ maxSessions: 1 });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const initialize = message(1, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'limit-test', version: '1.0.0' },
  });

  try {
    const invalid = await post(baseUrl, { ...initialize, jsonrpc: '1.0' });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.headers.get('mcp-session-id'), null);

    const first = await post(baseUrl, {
      ...initialize,
      params: {
        ...initialize.params,
        protocolVersion: '2024-11-05',
      },
    });
    assert.equal(first.status, 200);
    assert.equal((await first.json()).result.protocolVersion, '2025-11-25');

    const second = await post(baseUrl, { ...initialize, id: 2 });
    assert.equal(second.status, 503);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('HTTP transport serves sandboxed HTML artifacts without allowing symlink escapes', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-artifact-http-test-'));
  const outputRoot = path.join(temporary, 'data');
  fs.mkdirSync(outputRoot);
  fs.writeFileSync(path.join(outputRoot, 'diagram.html'), '<!doctype html><title>Diago</title>');
  fs.writeFileSync(path.join(temporary, 'outside.html'), '<!doctype html><title>Outside</title>');
  fs.symlinkSync(path.join(temporary, 'outside.html'), path.join(outputRoot, 'linked.html'));

  const server = createHttpServer({ outputRoot });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const artifact = await fetch(`${baseUrl}/artifacts/diagram.html`);
    assert.equal(artifact.status, 200);
    assert.equal(artifact.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.match(artifact.headers.get('content-security-policy'), /sandbox allow-scripts/);
    assert.match(await artifact.text(), /<title>Diago<\/title>/);

    const head = await fetch(`${baseUrl}/artifacts/diagram.html`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');

    const symlinkEscape = await fetch(`${baseUrl}/artifacts/linked.html`);
    assert.equal(symlinkEscape.status, 404);

    const nonHtml = await fetch(`${baseUrl}/artifacts/diagram.json`);
    assert.equal(nonHtml.status, 404);
  } finally {
    server.close();
    await once(server, 'close');
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
