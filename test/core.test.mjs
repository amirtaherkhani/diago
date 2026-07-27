import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { advise } from '../lib/recommender.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { fromRoot } from '../lib/paths.mjs';

test('advisor selects a sequence for an API request flow', () => {
  const result = advise('Trace the checkout API request and retry response step by step');
  assert.equal(result.recommendation.type, 'sequence');
  assert.match(result.recommendation.question, /request/i);
});

test('advisor selects dataflow for event lineage', () => {
  const result = advise('Show event data flow from queue through analytics into the database');
  assert.equal(result.recommendation.type, 'dataflow');
});

test('advisor falls back to feature architecture', () => {
  const result = advise('Explain this new capability');
  assert.equal(result.recommendation.type, 'architecture');
  assert.equal(result.recommendation.view, 'feature context');
});

test('example diagram plan passes review', () => {
  const plan = JSON.parse(
    fs.readFileSync(fromRoot('examples', 'checkout-feature.diagram-plan.json'), 'utf8'),
  );
  const result = reviewPlan(plan);
  assert.equal(result.ok, true);
  assert.equal(result.score, 100);
  assert.deepEqual(result.findings, []);
});

test('review rejects unsupported and malformed plans', () => {
  const result = reviewPlan({
    schemaVersion: 1,
    task: 'short',
    goal: '',
    audience: '',
    scope: {},
    evidence: {
      facts: [{ statement: 'A claim without a source.' }],
      assumptions: [],
      recommendations: [],
    },
    views: [{ type: 'class-diagram', question: '', focus: [] }],
  });

  assert.equal(result.ok, false);
  assert.ok(result.findings.some((item) => item.code === 'unsupported-fact'));
  assert.ok(result.findings.some((item) => item.code === 'invalid-view-type'));
});
