#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fromRoot } from '../lib/paths.mjs';
import { renderDiagramDocument } from '../lib/renderer-registry.mjs';
import { buildExplorerHtml } from '../lib/explorer.mjs';
import { presentationCss } from '../lib/renderers/presentation.mjs';

const directory = path.resolve(process.argv[2] ?? 'tmp/renderer-gallery');
if (fs.existsSync(directory)) throw new Error(`Gallery already exists: ${directory}. Choose a new directory.`);
fs.mkdirSync(directory, { recursive: true });
const examples = {
  architecture: 'plugin-request.architecture.json',
  sequence: 'presentation/sequence.json',
  workflow: 'presentation/workflow.json',
  dataflow: 'presentation/dataflow.json',
  lifecycle: 'presentation/lifecycle.json',
  'data-model': 'order-domain.data-model.json',
  timeline: 'payment-migration.timeline.json',
  layers: 'checkout-controls.layers.json',
  'dependency': 'checkout.dependency.json',
  'security-matrix': 'platform.security-matrix.json',
  'fishbone': 'latency.fishbone.json',
};
for (const [type, input] of Object.entries(examples)) {
  renderDiagramDocument({ type, diagram: JSON.parse(fs.readFileSync(fromRoot('examples', input), 'utf8')), outputPath: path.join(directory, `${type}.html`), quality: 'standard' });
}
fs.writeFileSync(path.join(directory, 'arrow-types.html'), buildExplorerHtml(JSON.parse(fs.readFileSync(fromRoot('examples/arrow-types.architecture-explorer.json'), 'utf8'))));
const links = Object.keys(examples).map(type => `<li><strong>${type}</strong> <a href="${type}.html?theme=dark">Dark</a> · <a href="${type}.html?theme=light">Light</a></li>`).join('\n');
fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html><html lang="en" data-theme="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Diago renderer gallery</title><style>${presentationCss}body{font:16px/1.7 system-ui,sans-serif;color:var(--text);max-width:900px;margin:auto;padding:32px}h1,a{color:var(--primary)}li{padding:14px;border-bottom:1px solid var(--line)}strong{display:inline-block;min-width:150px}</style><main><span class="diago-brand">Diago · Engineering workbench</span><h1>Renderer gallery</h1><p>${Object.keys(examples).length} deterministic outputs. Shared brand, specialized diagram semantics. These examples illustrate presentation, not verified facts about a production system.</p><ul>${links}<li><strong>Arrow types</strong> <a href="arrow-types.html?theme=dark">Dark</a> · <a href="arrow-types.html?theme=light">Light</a></li></ul></main></html>`);
console.log(`Gallery: ${path.join(directory, 'index.html')}`);
