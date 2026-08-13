import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { renderDiagramDocument, validateDiagramDocument } from '../lib/renderer-registry.mjs';
import { fromRoot } from '../lib/paths.mjs';

function readExample(name) {
  return JSON.parse(fs.readFileSync(fromRoot('examples', name), 'utf8'));
}

function renderTwice(type, diagram) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-native-renderer-test-'));
  try {
    const firstPath = path.join(directory, 'first.html');
    const secondPath = path.join(directory, 'second.html');
    const firstReceipt = renderDiagramDocument({ type, diagram, outputPath: firstPath });
    renderDiagramDocument({ type, diagram, outputPath: secondPath });
    return {
      firstReceipt,
      first: fs.readFileSync(firstPath, 'utf8'),
      second: fs.readFileSync(secondPath, 'utf8'),
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('data-model validates endpoints and renders accessible cardinality', () => {
  // Given a bounded persistence model with verified and proposed evidence
  const diagram = readExample('order-domain.data-model.json');

  // When the native model is validated and rendered twice
  const validation = validateDiagramDocument({ type: 'data-model', diagram });
  const rendered = renderTwice('data-model', diagram);

  // Then the artifact is accessible, complete, and deterministic
  assert.equal(validation.ok, true);
  assert.equal(validation.type, 'data-model');
  assert.equal(rendered.firstReceipt.type, 'data-model');
  assert.match(rendered.first, /<svg[^>]+role="img"/);
  assert.match(rendered.first, /aria-labelledby=/);
  assert.match(rendered.first, /<title id=/);
  assert.match(rendered.first, /<desc id=/);
  assert.match(rendered.first, /tabindex="0"/);
  assert.match(rendered.first, /1\.\.\*/);
  assert.match(rendered.first, /prefers-reduced-motion/);
  assert.equal(rendered.first, rendered.second);
});

test('data-model rejects an unknown relationship endpoint', () => {
  // Given a relationship that references an entity outside the model
  const diagram = readExample('order-domain.data-model.json');
  diagram.relationships[0].from = 'missing_entity';

  // When validation runs, then the endpoint error is explicit
  assert.throws(
    () => validateDiagramDocument({ type: 'data-model', diagram }),
    /unknown endpoint/i,
  );
});

test('data-model enforces the balanced entity budget', () => {
  // Given nine otherwise valid entities
  const diagram = readExample('order-domain.data-model.json');
  diagram.entities = Array.from({ length: 9 }, (_, index) => ({
    id: `entity_${index}`,
    label: `Entity ${index}`,
    status: 'verified',
    fields: [{ name: 'id', type: 'uuid', key: 'primary', required: true }],
  }));
  diagram.relationships = [];

  // When validation runs, then overview-detail decomposition is required
  assert.throws(
    () => validateDiagramDocument({ type: 'data-model', diagram }),
    /8 entities|overview-detail/i,
  );
});

test('data-model escapes untrusted labels in standalone HTML', () => {
  // Given a source label containing markup
  const diagram = readExample('order-domain.data-model.json');
  diagram.entities[0].label = '<script>alert(1)</script>';

  // When the model is rendered
  const rendered = renderTwice('data-model', diagram);

  // Then markup is displayed as text rather than executable HTML
  assert.doesNotMatch(rendered.first, /<script>alert\(1\)<\/script>/);
  assert.match(rendered.first, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
