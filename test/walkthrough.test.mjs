import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fromRoot } from '../lib/paths.mjs';
import { walkthroughAssets } from '../lib/renderers/walkthrough.mjs';
import { dataModelRenderer } from '../lib/renderers/data-model.mjs';
import { timelineRenderer } from '../lib/renderers/timeline.mjs';
import { layersRenderer } from '../lib/renderers/layers.mjs';

test('walkthrough assets are offline, bounded, and wait for DOM readiness', () => {
 const assets = walkthroughAssets();
 assert.ok(Buffer.byteLength(assets) < 16000);
 assert.doesNotMatch(assets, /<script[^>]+src=/);
 assert.match(assets, /Connection review steps/);
 assert.match(assets, /data-diago-walk-badge/);
 assert.match(assets, /STEP \$\{String\(index \+ 1\)/);
 assert.match(assets, /data-endpoint="source"/);
 assert.match(assets, /data-endpoint="target"/);
 assert.match(assets, /order does not imply execution|not an inferred execution sequence/);
 let initialized;
 vm.runInNewContext(fs.readFileSync(fromRoot('lib/walkthrough/viewer.js'), 'utf8'), {
  document: {readyState:'loading', addEventListener(event, callback) {assert.equal(event,'DOMContentLoaded'); initialized = callback;}},
 });
 assert.equal(typeof initialized, 'function');
});

for (const [adapter,file] of [[dataModelRenderer,'order-domain.data-model.json'],[timelineRenderer,'payment-migration.timeline.json'],[layersRenderer,'checkout-controls.layers.json']]) {
 test(`${file} exposes valid walkthrough endpoints in desktop and mobile views`, () => {
  const diagram = JSON.parse(fs.readFileSync(fromRoot('examples',file)));
  const html = adapter.render(diagram,'standard');
  const graphs = [...html.matchAll(/<svg class="diagram-view[\s\S]*?<\/svg>/g)].map(m=>m[0]);
  assert.equal(graphs.length,2);
  for (const graph of graphs) {
   const ids = new Set([...graph.matchAll(/data-node-id="([^"]+)"/g)].map(m=>m[1]));
   const edges = [...graph.matchAll(/data-edge-from="([^"]+)" data-edge-to="([^"]+)"/g)];
   assert.ok(edges.length);
   for (const [,from,to] of edges) {assert.ok(ids.has(from),from);assert.ok(ids.has(to),to);}
   assert.match(graph,/role="group"/);
  }
 });
}
