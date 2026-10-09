import fs from 'node:fs';
import { fromRoot } from '../paths.mjs';

export function walkthroughAssets() {
  return `<style>${fs.readFileSync(fromRoot('lib/walkthrough/viewer.css'), 'utf8')}</style><script>${fs.readFileSync(fromRoot('lib/walkthrough/viewer.js'), 'utf8')}</script>`;
}
