import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fromRoot } from './paths.mjs';

const archifyBin = fromRoot('vendor', 'archify', 'bin', 'archify.mjs');

export function runArchify(args, options = {}) {
  if (!fs.existsSync(archifyBin)) {
    throw new Error(`Bundled Archify runtime is missing at ${archifyBin}`);
  }

  return spawnSync(process.execPath, [archifyBin, ...args], {
    cwd: options.cwd ?? process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
}
