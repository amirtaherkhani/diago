#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fromRoot } from '../lib/paths.mjs';
import { renderDiagramDocument } from '../lib/renderer-registry.mjs';
import { presentationCss, nativeThemeScript } from '../lib/renderers/presentation.mjs';
import { themeControl } from '../lib/renderers/theme-control.mjs';

const directory = fromRoot('docs/models');
fs.mkdirSync(directory, { recursive: true });
const examples = { dependency: 'checkout.dependency.json', 'security-matrix': 'platform.security-matrix.json', fishbone: 'latency.fishbone.json' };
for (const [type, file] of Object.entries(examples)) {
  renderDiagramDocument({ type, diagram: JSON.parse(fs.readFileSync(fromRoot('examples', file), 'utf8')), outputPath: path.join(directory, `${type}.html`) });
}
const links = Object.keys(examples).map(type => `<article><h2>${type}</h2><p><a href="${type}.html?theme=light">Light</a> · <a href="${type}.html?theme=dark">Dark</a></p></article>`).join('\n');
fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Preview Diago dependency graphs, permission matrices, and incident fishbones in light and dark themes."><title>New engineering models · Diago</title><style>${presentationCss}
body{font:16px/1.7 system-ui,sans-serif;color:var(--text);margin:0}main{max-width:960px;margin:auto;padding:32px 24px}h1{font-size:clamp(28px,5vw,48px);line-height:1.1}h2{font-size:22px}a{color:var(--primary)}article{padding:16px 0;border-top:1px solid var(--line)}header{display:flex;justify-content:space-between;align-items:center}p{color:var(--muted)}a:focus-visible{outline:2px solid var(--primary);outline-offset:4px}
</style>${nativeThemeScript}</head><body><main><header><a href="../">Diago</a><div class="diago-theme-group">${themeControl()}</div></header><h1>Three new engineering perspectives.</h1><p>Source checkout additions after v0.7.0. All examples are illustrative, with fictional evidence. The catalog now includes 11 specialized models.</p>${links}<p><a href="https://github.com/amirtaherkhani/diago/blob/main/docs/engineering-models.md">Authoring guide</a> · <a href="https://github.com/amirtaherkhani/diago/blob/main/docs/upstreams/diagram-design-engineering-review.md">Upstream research and selection</a></p></main></body></html>\n`);
console.log('Generated docs/models/');
