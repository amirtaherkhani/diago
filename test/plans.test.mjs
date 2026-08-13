import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { normalizePlan } from '../lib/plan-compat.mjs';
import { createPlan } from '../lib/planner.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { fromRoot } from '../lib/paths.mjs';

function readJson(...segments) {
  return JSON.parse(fs.readFileSync(fromRoot(...segments), 'utf8'));
}

test('planner creates schema v2 with selection complexity and fidelity contracts', () => {
  // Given a repository question with an explicit audience and destination
  const context = {
    sourceKind: 'repository',
    audienceDetail: 'technical',
    destination: 'architecture-review',
  };

  // When a reusable plan is created
  const plan = createPlan('Map domain entities, fields, and foreign keys', context);

  // Then it records the complete schema-v2 machine contract
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.source.kind, 'repository');
  assert.equal(plan.selection.questionKind, 'entity-relationship');
  assert.equal(plan.selection.renderer, 'data-model');
  assert.equal(plan.selection.profile, 'persistence-schema');
  assert.equal(plan.views[0].role, 'primary');
  assert.equal(plan.views[0].profile, plan.selection.profile);
  assert.deepEqual(plan.complexity.budget, { entities: 8, relationships: 12 });
  assert.deepEqual(plan.fidelity, {
    merged: [],
    collapsed: [],
    omitted: [],
    preserved: [],
  });
  assert.equal(plan.output.destination, 'architecture-review');
});

test('legacy plan remains reviewable through non-mutating normalization', () => {
  // Given a valid schema-v1 plan
  const legacy = readJson('test', 'fixtures', 'legacy-plan-v1.json');
  const before = JSON.stringify(legacy);

  // When it is normalized and reviewed
  const normalized = normalizePlan(legacy);
  const result = reviewPlan(legacy);

  // Then v2 defaults are available without changing the caller's object
  assert.equal(normalized.schemaVersion, 2);
  assert.equal(normalized.selection.renderer, 'sequence');
  assert.equal(normalized.views[0].profile, 'request-walkthrough');
  assert.equal(JSON.stringify(legacy), before);
  assert.equal(result.ok, true);
  assert.ok(result.findings.some(({ code }) => code === 'schema-v1-compat'));
});

test('review rejects a renderer and profile mismatch', () => {
  // Given a valid generated plan with a profile from another renderer
  const plan = createPlan('Trace an API request and response');
  plan.views[0].profile = 'migration-plan';

  // When the plan is reviewed
  const result = reviewPlan(plan);

  // Then the incompatible profile blocks delivery
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(({ code }) => code === 'renderer-profile-mismatch'));
});

test('review requires fidelity entries for an overview-detail decomposition', () => {
  // Given an explicitly decomposed plan with no recorded reduction
  const plan = createPlan('Map every service and dependency in this platform');
  plan.complexity.decomposition = 'overview-detail';

  // When the plan is reviewed
  const result = reviewPlan(plan);

  // Then silent reduction is rejected
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(({ code }) => code === 'missing-fidelity'));
});

test('review blocks local absolute paths from public evidence', () => {
  // Given a plan whose fact source exposes a local user path
  const plan = createPlan('Explain checkout ownership and dependencies');
  plan.evidence.facts.push({
    statement: 'Checkout is owned by the API module.',
    source: '/Users/example/private/checkout.mjs',
  });

  // When the plan is reviewed
  const result = reviewPlan(plan);

  // Then the unsafe public source label is a blocker
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(({ code }) => code === 'unsafe-source-label'));
});

test('review reports malformed source references without throwing', () => {
  // Given an otherwise valid plan with a non-array source reference contract
  const plan = createPlan('Explain checkout ownership and dependencies');
  plan.source.references = { private: 'src/checkout' };

  // When the plan is reviewed
  const result = reviewPlan(plan);

  // Then malformed external input becomes a finding instead of a runtime error
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(({ code }) => code === 'invalid-source-references'));
});

test('review rejects empty or non-object complexity budgets', () => {
  // Given two schema-invalid budget shapes
  for (const budget of [{}, [1]]) {
    const plan = createPlan('Explain checkout ownership and dependencies');
    plan.complexity.budget = budget;

    // When each plan is reviewed, then its budget contract blocks delivery
    const result = reviewPlan(plan);
    assert.equal(result.ok, false);
    assert.ok(result.findings.some(({ code }) => code === 'invalid-complexity-budget'));
  }
});

test('schema v2 checkout example passes review without findings', () => {
  // Given the public checkout plan example
  const plan = readJson('examples', 'checkout-feature.diagram-plan.json');

  // When it is reviewed
  const result = reviewPlan(plan);

  // Then the example satisfies the complete contract
  assert.equal(plan.schemaVersion, 2);
  assert.equal(result.ok, true);
  assert.equal(result.score, 100);
  assert.deepEqual(result.findings, []);
});
