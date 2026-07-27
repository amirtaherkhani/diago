#!/usr/bin/env node

import fs from 'node:fs';
import { fromRoot } from '../lib/paths.mjs';

const [name, ref, commit] = process.argv.slice(2);
const lockPath = fromRoot('vendor', 'upstreams.lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

if (!lock.sources[name]) {
  console.error(`Unknown upstream "${name}".`);
  process.exit(2);
}

if (!/^[0-9a-f]{40}$/.test(commit ?? '')) {
  console.error('Commit must be a full 40-character SHA.');
  process.exit(2);
}

lock.sources[name].ref = ref;
lock.sources[name].commit = commit;
lock.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
