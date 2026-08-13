import fs from 'node:fs';
import path from 'node:path';

function canonicalIntendedPath(target) {
  const missingSegments = [];
  let existingPath = target;

  while (!fs.existsSync(existingPath)) {
    const parent = path.dirname(existingPath);
    if (parent === existingPath) break;
    missingSegments.unshift(path.basename(existingPath));
    existingPath = parent;
  }

  return path.resolve(fs.realpathSync(existingPath), ...missingSegments);
}

function enforceOutputRoot(outputPath) {
  const configuredRoot = process.env.DIAGO_OUTPUT_ROOT?.trim();
  if (!configuredRoot) return;
  if (!path.isAbsolute(configuredRoot)) {
    throw new TypeError('DIAGO_OUTPUT_ROOT must be an absolute path.');
  }
  if (!fs.existsSync(configuredRoot)) {
    throw new TypeError(`DIAGO_OUTPUT_ROOT does not exist: ${configuredRoot}`);
  }

  const canonicalRoot = fs.realpathSync(configuredRoot);
  const relative = path.relative(canonicalRoot, canonicalIntendedPath(outputPath));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new TypeError(`outputPath must stay inside DIAGO_OUTPUT_ROOT (${canonicalRoot}).`);
  }
}

export function prepareOutputPath(outputPath, overwrite) {
  if (typeof outputPath !== 'string' || !path.isAbsolute(outputPath)) {
    throw new TypeError('outputPath must be an absolute path.');
  }
  if (path.extname(outputPath).toLowerCase() !== '.html') {
    throw new TypeError('outputPath must end in .html.');
  }
  enforceOutputRoot(outputPath);
  if (overwrite !== undefined && typeof overwrite !== 'boolean') {
    throw new TypeError('overwrite must be a boolean.');
  }
  if (fs.existsSync(outputPath) && overwrite !== true) {
    return { ok: false, message: `Refusing to replace existing artifact "${outputPath}". Retry with overwrite: true only if replacement is intended.` };
  }
  return { ok: true, outputPath };
}
