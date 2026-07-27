#!/usr/bin/env node

import readline from 'node:readline';
import { createMcpSession, errorResponse } from './protocol.mjs';

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const session = createMcpSession();

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
    write(errorResponse(null, -32700, 'Parse error.', parseError.message));
    continue;
  }

  const response = session.handle(message);
  if (response) write(response);
}
