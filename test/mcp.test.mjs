import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { callTool, TOOL_DEFINITIONS, UnknownToolError } from '../mcp/tools.mjs';
import { fromRoot } from '../lib/paths.mjs';

function readExample() {
  return JSON.parse(
    fs.readFileSync(fromRoot('examples', 'plugin-request.architecture.json'), 'utf8'),
  );
}

test('MCP handlers advise, plan, and review without writing files', () => {
  assert.equal(TOOL_DEFINITIONS.length, 6);
  assert.ok(TOOL_DEFINITIONS.every((tool) => tool.inputSchema.type === 'object'));

  const catalog = callTool('list_diagram_types', {});
  assert.equal(catalog.isError, false);
  assert.deepEqual(catalog.structuredContent.types.map(({ type }) => type), [
    'architecture',
    'sequence',
    'workflow',
    'dataflow',
    'lifecycle',
    'data-model',
    'timeline',
    'layers',
  ]);
  assert.equal(callTool('list_diagram_types', { extra: true }).isError, true);

  const advice = callTool('advise_diagram', {
    task: 'Trace an API request and its retry response',
  });
  assert.equal(advice.isError, false);
  assert.equal(advice.structuredContent.recommendation.type, 'sequence');
  assert.equal(callTool('advise_diagram', { task: 'Trace a request', extra: true }).isError, true);

  const plan = callTool('create_diagram_plan', {
    task: 'Trace an API request and its retry response',
    sourceKind: 'conversation',
    audienceDetail: 'mixed',
    destination: 'design-review',
  });
  assert.equal(plan.isError, false);
  assert.equal(plan.structuredContent.schemaVersion, 2);
  assert.equal(plan.structuredContent.source.kind, 'conversation');
  assert.equal(plan.structuredContent.audience.detail, 'mixed');
  assert.equal(plan.structuredContent.output.destination, 'design-review');
  assert.equal(plan.structuredContent.views[0].type, 'sequence');

  const review = callTool('review_diagram_plan', {
    plan: plan.structuredContent,
  });
  assert.equal(review.isError, false);
  assert.equal(review.structuredContent.ok, true);
  assert.ok(review.structuredContent.findings.some((item) => item.code === 'no-facts'));

  assert.throws(() => callTool('does_not_exist', {}), UnknownToolError);
});

test('MCP validate and render tools use bundled Archify with overwrite protection', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-mcp-test-'));
  try {
    const diagram = readExample();
    const outputPath = path.join(temporary, 'plugin-request.html');

    const validation = callTool('validate_diagram', {
      type: 'architecture',
      diagram,
      quality: 'showcase',
    });
    assert.equal(validation.isError, false, validation.content[0].text);
    assert.equal(validation.structuredContent.ok, true);
    assert.equal(validation.structuredContent.input, '<inline-diagram>');

    const render = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath,
      quality: 'showcase',
    });
    assert.equal(render.isError, false, render.content[0].text);
    assert.equal(render.structuredContent.ok, true);
    assert.match(render.content[0].text, /"sha256"/);
    assert.ok(fs.readFileSync(outputPath, 'utf8').includes('<svg'));

    const protectedRender = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath,
    });
    assert.equal(protectedRender.isError, true);
    assert.match(protectedRender.content[0].text, /Refusing to replace/);

    const overwrite = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath,
      overwrite: true,
    });
    assert.equal(overwrite.isError, false, overwrite.content[0].text);

    const invalidOverwrite = callTool('render_diagram', {
      type: 'architecture',
      diagram,
      outputPath: path.join(temporary, 'invalid-overwrite.html'),
      overwrite: 'yes',
    });
    assert.equal(invalidOverwrite.isError, true);
    assert.match(invalidOverwrite.content[0].text, /overwrite must be a boolean/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('render_diagram stays inside DIAGO_OUTPUT_ROOT when configured', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-output-root-test-'));
  const outputRoot = path.join(temporary, 'data');
  fs.mkdirSync(outputRoot);
  const previousOutputRoot = process.env.DIAGO_OUTPUT_ROOT;
  process.env.DIAGO_OUTPUT_ROOT = outputRoot;

  try {
    const allowed = callTool('render_diagram', {
      type: 'architecture',
      diagram: readExample(),
      outputPath: path.join(outputRoot, 'allowed.html'),
    });
    assert.equal(allowed.isError, false, allowed.content[0].text);

    const escaped = callTool('render_diagram', {
      type: 'architecture',
      diagram: readExample(),
      outputPath: path.join(temporary, 'escaped.html'),
    });
    assert.equal(escaped.isError, true);
    assert.match(escaped.content[0].text, /must stay inside DIAGO_OUTPUT_ROOT/);

    const linkedDirectory = path.join(outputRoot, 'linked');
    fs.symlinkSync(temporary, linkedDirectory, 'dir');
    const symlinkEscape = callTool('render_diagram', {
      type: 'architecture',
      diagram: readExample(),
      outputPath: path.join(linkedDirectory, 'escaped-through-link.html'),
    });
    assert.equal(symlinkEscape.isError, true);
    assert.match(symlinkEscape.content[0].text, /must stay inside DIAGO_OUTPUT_ROOT/);
  } finally {
    if (previousOutputRoot === undefined) delete process.env.DIAGO_OUTPUT_ROOT;
    else process.env.DIAGO_OUTPUT_ROOT = previousOutputRoot;
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
