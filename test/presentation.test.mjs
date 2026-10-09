import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fromRoot } from '../lib/paths.mjs';
import { renderDiagramDocument } from '../lib/renderer-registry.mjs';
import { applyDiagoPresentation } from '../lib/renderers/presentation.mjs';

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
