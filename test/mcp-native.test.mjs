import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fromRoot } from '../lib/paths.mjs';
import { callTool } from '../mcp/tools.mjs';

test('MCP creates schema-v2 plans for every evidence source kind', () => {
  // Given all supported evidence source classifications
  for (const sourceKind of ['prompt', 'repository', 'conversation', 'mixed']) {
    // When the plan tool receives that source context
    const result = callTool('create_diagram_plan', {
      task: 'Map checkout entities, ownership, and behavior',
      sourceKind,
    });

    // Then the generated plan preserves the classification
    assert.equal(result.isError, false, result.content[0].text);
    assert.equal(result.structuredContent.schemaVersion, 2);
    assert.equal(result.structuredContent.source.kind, sourceKind);
  }
});

test('MCP validates and renders every Diago-owned native example', () => {
  // Given the native renderer fixtures
  const examples = [
    ['data-model', 'order-domain.data-model.json'],
    ['timeline', 'payment-migration.timeline.json'],
    ['layers', 'checkout-controls.layers.json'],
  ];
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-native-mcp-'));

  try {
    for (const [type, file] of examples) {
      const diagram = JSON.parse(fs.readFileSync(fromRoot('examples', file), 'utf8'));
      const outputPath = path.join(temporary, `${type}.html`);

      // When validation and rendering run through native MCP tools
      const validation = callTool('validate_diagram', { type, diagram });
      const render = callTool('render_diagram', { type, diagram, outputPath });

      // Then both structured outcomes use the selected native renderer
      assert.equal(validation.isError, false, validation.content[0].text);
      assert.equal(validation.structuredContent.type, type);
      assert.equal(render.isError, false, render.content[0].text);
      assert.equal(render.structuredContent.type, type);
      assert.match(fs.readFileSync(outputPath, 'utf8'), /role="img"/);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
