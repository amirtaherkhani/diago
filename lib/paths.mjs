import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function fromRoot(...segments) {
  return path.join(rootDirectory, ...segments);
}
