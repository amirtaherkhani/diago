import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ARROW_TYPES, ARROW_RULES, arrowAssets, prepareArchifyArrows } from '../lib/arrows.mjs';
import { renderDiagramDocument, validateDiagramDocument } from '../lib/renderer-registry.mjs';
import { buildExplorerHtml, validateExplorer } from '../lib/explorer.mjs';
import { callTool } from '../mcp/tools.mjs';
import { fromRoot } from '../lib/paths.mjs';

const examples = {architecture:'plugin-request.architecture.json',sequence:'presentation/sequence.json',workflow:'presentation/workflow.json',dataflow:'presentation/dataflow.json',lifecycle:'presentation/lifecycle.json','data-model':'order-domain.data-model.json',timeline:'payment-migration.timeline.json',layers:'checkout-controls.layers.json',dependency:'checkout.dependency.json','security-matrix':'platform.security-matrix.json',fishbone:'latency.fishbone.json'};
const read = type => JSON.parse(fs.readFileSync(fromRoot('examples', examples[type]), 'utf8'));
const temporary = callback => { const directory=fs.mkdtempSync(path.join(os.tmpdir(),'diago-arrows-test-'));try{return callback(directory);}finally{fs.rmSync(directory,{recursive:true,force:true});} };

for(const [type] of Object.entries(examples)) test(`${type}: embeds an offline arrow guide and correct default semantics`,()=>temporary(directory=>{
 const diagram=read(type), before=JSON.stringify(diagram), outputPath=path.join(directory,'view.html');
 const receipt=renderDiagramDocument({type,diagram,outputPath,quality:'standard'});
 const html=fs.readFileSync(outputPath,'utf8');
 assert.match(html,/Arrow guide/);assert.match(html,/All six Diago connection types/);
 assert.ok(html.includes(`data-diago-arrow-model="${type}"`));
 const rule=ARROW_RULES[type];
 if(rule) assert.ok(html.includes(`data-arrow-type="${rule.default}"`));
 if(type==='security-matrix') assert.doesNotMatch(html,/data-arrow-type="/);
 if(type==='fishbone') assert.match(html,/data-arrow-type="effect"/);
 assert.equal(receipt.artifact.sha256,createHash('sha256').update(html).digest('hex'));
 assert.equal(JSON.stringify(diagram),before);
}));

for(const arrow of ARROW_TYPES) test(`architecture: authored ${arrow} survives validation and rendering`,()=>temporary(directory=>{
 const diagram=read('architecture');diagram.connections[0].arrow=arrow;
 assert.equal(validateDiagramDocument({type:'architecture',diagram,quality:'standard'}).ok,true);
 const outputPath=path.join(directory,'view.html');
 const result=callTool('render_diagram',{type:'architecture',diagram,outputPath,quality:'standard'});
 assert.equal(result.isError,false,result.content[0].text);
 assert.ok(fs.readFileSync(outputPath,'utf8').includes(`data-arrow-type="${arrow}"`));
}));

for(const [type,rule] of Object.entries(ARROW_RULES)) test(`${type}: rejects unsupported or malformed arrow types`,()=>{
 for(const arrow of ['invented','<script>',null,12]){
  const diagram=read(type);diagram[rule.collection][0].arrow=arrow;
  assert.throws(()=>validateDiagramDocument({type,diagram,quality:'standard'}),/arrow must be one of/);
 }
});

test('sequence: return variant implies response, and contradictory types fail',()=>temporary(directory=>{
 const diagram=read('sequence');diagram.messages[0].variant='return';
 const outputPath=path.join(directory,'return.html');renderDiagramDocument({type:'sequence',diagram,outputPath,quality:'standard'});
 assert.match(fs.readFileSync(outputPath,'utf8'),/data-arrow-type="response"/);
 diagram.messages[0].arrow='event';
 assert.throws(()=>validateDiagramDocument({type:'sequence',diagram,quality:'standard'}),/conflicts with the return variant/);
}));

test('upstream adapter strips only the validated edge extension and preserves snapshots',()=>temporary(directory=>{
 const source=fromRoot('vendor/archify/renderers/shared/validator.mjs');const snapshot=fs.readFileSync(source);
 const diagram=read('architecture');diagram.connections[0].arrow='event';diagram.components[0].arrow='event';
 assert.throws(()=>validateDiagramDocument({type:'architecture',diagram,quality:'standard'}),/arrow|additional/i);
 assert.deepEqual(fs.readFileSync(source),snapshot);
 fs.mkdirSync(path.join(directory,'assets'),{recursive:true});fs.writeFileSync(path.join(directory,'assets/template.html'),'changed');
 fs.mkdirSync(path.join(directory,'renderers/shared'),{recursive:true});fs.writeFileSync(path.join(directory,'renderers/shared/validator.mjs'),'changed');
 assert.throws(()=>prepareArchifyArrows(directory),/adapter contract changed/);
}));

test('CLI validates custom arrows without rewriting the input',()=>temporary(directory=>{
 const diagram=read('sequence');diagram.messages[0].arrow='event';const input=path.join(directory,'in.json');const bytes=JSON.stringify(diagram);fs.writeFileSync(input,bytes);
 const result=spawnSync(process.execPath,[fromRoot('bin/diago.mjs'),'validate','sequence',input,'--quality','standard','--json'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(input,'utf8'),bytes);
}));

test('Explorer supports all arrow types without changing evidence rules',()=>{
 const diagram=JSON.parse(fs.readFileSync(fromRoot('examples/diago.architecture-explorer.json')));
 for(const type of ARROW_TYPES){diagram.views[0].edges[0].arrow=type;assert.equal(validateExplorer(diagram).ok,true);assert.match(buildExplorerHtml(diagram),/diago:graph-render/);}
 diagram.views[0].edges[0].arrow='made-up';assert.throws(()=>validateExplorer(diagram),/edge.arrow/);
});

test('arrow helper is bounded, uses small markers, and preserves line semantics',()=>{
 const assets=arrowAssets('architecture');assert.ok(Buffer.byteLength(assets)<14000);
 assert.doesNotMatch(assets,/<script[^>]+src=|fetch\(|setInterval\(|stroke-dasharray/);
 assert.match(assets,/markerWidth:model===\x27explorer\x27\?4\.5:5\.25/);assert.match(assets,/context-stroke/);
 assert.throws(()=>arrowAssets('untrusted"'),/Unknown arrow guide model/);
});

test('every allowed edge type validates without mutating native or upstream documents', () => {
  for (const [type, rule] of Object.entries(ARROW_RULES)) {
    for (const arrow of rule.allowed) {
      const diagram = read(type);
      diagram[rule.collection][0].arrow = arrow;
      const before = JSON.stringify(diagram);
      assert.equal(validateDiagramDocument({type, diagram, quality: 'standard'}).ok, true);
      assert.equal(JSON.stringify(diagram), before);
    }
  }
});

test('published arrow and Explorer previews match their source documents', () => {
  for (const [source, output] of [['arrow-types.architecture-explorer.json', 'arrows'], ['diago.architecture-explorer.json', 'explorer']]) {
    const diagram = JSON.parse(fs.readFileSync(fromRoot('examples', source), 'utf8'));
    assert.equal(fs.readFileSync(fromRoot('docs', output, 'index.html'), 'utf8'), buildExplorerHtml(diagram));
  }
});

test('CLI/MCP catalog exposes per-model arrow constraints without sharing mutable arrays', () => {
  const first = callTool('list_diagram_types', {}).structuredContent;
  const architecture = first.types.find(t => t.type === 'architecture');
  assert.deepEqual(architecture.arrows.allowed, ARROW_TYPES);
  assert.equal(first.types.find(t => t.type === 'data-model').arrows.default, 'association');
  assert.deepEqual(first.types.find(t => t.type === 'security-matrix').arrows.allowed, []);
  architecture.arrows.allowed.push('fake');
  assert.deepEqual(callTool('list_diagram_types', {}).structuredContent.types.find(t => t.type === 'architecture').arrows.allowed, ARROW_TYPES);
});

test('upstream render paths preserve event metadata, and associations cannot become directed routes', () => temporary(directory => {
  for (const type of ['sequence', 'workflow', 'dataflow']) {
    const diagram = read(type); diagram[ARROW_RULES[type].collection][0].arrow = 'event';
    const outputPath = path.join(directory, `${type}.html`);
    renderDiagramDocument({type, diagram, outputPath, quality: 'standard'});
    assert.match(fs.readFileSync(outputPath, 'utf8'), /data-arrow-type="event"/);
  }
  const diagram = read('architecture'); diagram.connections[0].arrow = 'association';
  const outputPath = path.join(directory, 'association.html');
  renderDiagramDocument({type: 'architecture', diagram, outputPath, quality: 'standard'});
  const html = fs.readFileSync(outputPath, 'utf8');
  assert.match(html, /seen\[key\] \|\| edge.getAttribute\('data-arrow-type'\) === 'association'/);
  assert.match(html, /from === to \|\| edge.getAttribute\('data-arrow-type'\) === 'association'/);
}));
