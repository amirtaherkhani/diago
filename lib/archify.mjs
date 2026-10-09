import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyDiagoPresentation, compactArchifyMarkers } from './renderers/presentation.mjs';
import { ARROW_RULES, prepareArchifyArrows, validateArrows } from './arrows.mjs';
import { fromRoot } from './paths.mjs';

const archifyBin = fromRoot('vendor', 'archify', 'bin', 'archify.mjs');

export function runArchify(args, options = {}) {
  if (!fs.existsSync(archifyBin)) {
    throw new Error(`Bundled Archify runtime is missing at ${archifyBin}`);
  }

  // Prepare the branded template before upstream validation, hashing and delivery.
  // A private disposable runtime preserves upstream locking/provenance semantics.
  let directory;
  let customArrows = false;
  const inputPath = args[2] && path.resolve(options.cwd ?? process.cwd(), args[2]);
  if (['validate', 'render', 'deliver'].includes(args[0]) && inputPath && fs.existsSync(inputPath)) {
    const diagram = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    validateArrows(args[1], diagram);
    const collection = ARROW_RULES[args[1]]?.collection;
    customArrows = Array.isArray(diagram?.[collection]) && diagram[collection].some(edge => edge?.arrow !== undefined);
  }
  try {
    let bin = archifyBin;
    if (['render', 'deliver'].includes(args[0]) || customArrows) {
      directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-runtime-'));
      fs.cpSync(fromRoot('vendor', 'archify'), directory, { recursive: true });
      const template = path.join(directory, 'assets', 'template.html');
      fs.writeFileSync(template, applyDiagoPresentation(compactArchifyMarkers(fs.readFileSync(template, 'utf8')), args[1]));
      const definitions = path.join(directory, 'renderers', 'shared', 'utils.mjs');
      fs.writeFileSync(definitions, compactArchifyMarkers(fs.readFileSync(definitions, 'utf8')));
      prepareArchifyArrows(directory);
      bin = path.join(directory, 'bin', 'archify.mjs');
    }
    return spawnSync(process.execPath, [bin, ...args], {
      cwd: options.cwd ?? process.cwd(),
      encoding: 'utf8',
      stdio: options.capture ? 'pipe' : 'inherit',
    });
  } finally {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  }
}
