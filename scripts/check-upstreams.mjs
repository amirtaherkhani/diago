#!/usr/bin/env node

import fs from 'node:fs';
import { fromRoot } from '../lib/paths.mjs';
import { checkUpstreams, formatUpstreamReport } from '../lib/upstream-checker.mjs';

const lock = JSON.parse(fs.readFileSync(fromRoot('vendor', 'upstreams.lock.json'), 'utf8'));
const result = await checkUpstreams(lock.sources, {
  token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
});

console.log(process.argv.includes('--json')
  ? JSON.stringify(result, null, 2)
  : formatUpstreamReport(result));
process.exitCode = Object.values(result).some((source) => source.error) ? 1 : 0;
