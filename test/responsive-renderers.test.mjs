import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { renderDiagramDocument } from '../lib/renderer-registry.mjs';
import { fromRoot } from '../lib/paths.mjs';

function renderExample(type, file) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-responsive-renderer-'));
  try {
    const diagram = JSON.parse(fs.readFileSync(fromRoot('examples', file), 'utf8'));
    const output = path.join(directory, `${type}.html`);
    renderDiagramDocument({ type, diagram, outputPath: output });
    return fs.readFileSync(output, 'utf8');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('native renderers ship a dedicated mobile view instead of a clipped canvas', () => {
  // Given every Diago-owned renderer example
  const examples = [
    ['data-model', 'order-domain.data-model.json'],
    ['timeline', 'payment-migration.timeline.json'],
    ['layers', 'checkout-controls.layers.json'],
  ];

  for (const [type, file] of examples) {
    // When it is rendered through the shared standalone contract
    const html = renderExample(type, file);

    // Then desktop and mobile each receive a complete, viewport-sized SVG
    assert.match(html, /class="diagram-view diagram-desktop"/);
    assert.match(html, /class="diagram-view diagram-mobile"/);
    assert.doesNotMatch(html, /min-width:680px/);
  }
});
