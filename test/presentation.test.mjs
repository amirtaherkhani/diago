import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fromRoot } from '../lib/paths.mjs';
import { renderDiagramDocument } from '../lib/renderer-registry.mjs';
import { applyDiagoPresentation, presentationCss } from '../lib/renderers/presentation.mjs';

const examples = {
 architecture: 'plugin-request.architecture.json',
 sequence: 'presentation/sequence.json', workflow: 'presentation/workflow.json',
 dataflow: 'presentation/dataflow.json', lifecycle: 'presentation/lifecycle.json',
 'data-model': 'order-domain.data-model.json', timeline: 'payment-migration.timeline.json',
 layers: 'checkout-controls.layers.json',
};
for (const [type, example] of Object.entries(examples)) {
 test(`${type} delivers Diago presentation with a correct artifact receipt`, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-style-test-'));
  const snapshot = fs.readFileSync(fromRoot('vendor/archify/assets/template.html'));
  try {
   const outputPath = path.join(directory, 'diagram.html');
   const diagram = JSON.parse(fs.readFileSync(fromRoot('examples', example), 'utf8'));
   const receipt = renderDiagramDocument({type, diagram, outputPath, quality:'standard'});
   const html = fs.readFileSync(outputPath);
   assert.match(html.toString(), /--bg:#080f20/);
   assert.match(html.toString(), /class="diago-theme"/);
   assert.match(html.toString(), /class="diago-theme-track"/);
   assert.match(html.toString(), /aria-label="Toggle color theme"/);
   assert.match(html.toString(), /markerWidth="(?:7\.5|5\.25)" markerHeight="5\.25"/);
   assert.doesNotMatch(html.toString(), /markerWidth="10" markerHeight="7"/);
   assert.match(html.toString(), /--primary:#ffbe0b/);
   assert.match(html.toString(), /data-theme="light"/);
   assert.equal(receipt.artifact.sha256, createHash('sha256').update(html).digest('hex'));
   assert.equal(receipt.artifact.bytes, html.length);
   assert.deepEqual(fs.readFileSync(fromRoot('vendor/archify/assets/template.html')), snapshot);
  } finally { fs.rmSync(directory, {recursive:true,force:true}); }
 });
}
test('CLI delivery receives the same presentation before provenance is signed', () => {
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'diago-cli-style-'));
 try {
  const output=path.join(directory,'diagram.html');
  const result=spawnSync(process.execPath,[fromRoot('bin/diago.mjs'),'deliver','architecture',fromRoot('examples/plugin-request.architecture.json'),output,'--quality','standard','--json'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const receipt=JSON.parse(result.stdout);
  assert.equal(receipt.artifact.sha256,createHash('sha256').update(fs.readFileSync(output)).digest('hex'));
  const provenance=fs.readdirSync(directory).find(name=>name.endsWith('.delivery.json'));
  assert.ok(provenance);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory,provenance))).artifact.sha256,receipt.artifact.sha256);
 } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('template drift fails explicitly instead of silently producing an unbranded artifact',()=>{
 assert.throws(()=>applyDiagoPresentation('<html></html>'),/presentation contract/);
});

test('Export has one borderless surface and a non-border keyboard focus indicator', () => {
 assert.match(presentationCss, /border:0;box-shadow:none;outline:none/);
 assert.match(presentationCss, /#btn-export::after \{content:none;display:none;box-shadow:none\}/);
 assert.match(presentationCss, /#btn-export:focus-visible \{outline:none;text-decoration:underline/);
});

test('decoration uses low-opacity pastel tokens and flat diagram surfaces', () => {
 assert.match(presentationCss, /--pastel-blue:rgba\(186,215,239,\.035\)/);
 assert.match(presentationCss, /--pastel-lilac:rgba\(220,205,238,\.09\)/);
 assert.match(presentationCss, /box-shadow:none!important/);
 assert.match(presentationCss, /--soft-shadow:0 3px 12px rgba\(166,188,218,\.12\)/);
});
