import assert from 'node:assert/strict';
import test from 'node:test';
import { listDiagramTypes } from '../lib/diagram-catalog.mjs';
import { advise } from '../lib/recommender.mjs';

test('catalog lists only the eight enabled native engineering renderers', () => {
  // Given the registered renderer catalog
  // When supported native types are listed
  const types = listDiagramTypes();

  // Then the public order and support status are deterministic
  assert.deepEqual(types.map(({ type }) => type), [
    'architecture',
    'sequence',
    'workflow',
    'dataflow',
    'lifecycle',
    'data-model',
    'timeline',
    'layers',
  ]);
  assert.ok(types.every(({ supported }) => supported));
});

test('advisor selects data model when entity relationships carry the decision', () => {
  // Given an engineering question about persistent entity structure
  const task = 'Show database entities, foreign keys, and cardinality';

  // When Diago selects the smallest supported view
  const result = advise(task);

  // Then it chooses the native data-model profile
  assert.equal(result.recommendation.type, 'data-model');
  assert.equal(result.recommendation.profile, 'persistence-schema');
});

test('advisor selects timeline when migration chronology carries the decision', () => {
  // Given an engineering question about ordered delivery milestones
  const task = 'Build a migration milestone timeline for the database cutover';

  // When Diago selects the smallest supported view
  const result = advise(task);

  // Then it chooses the native timeline profile
  assert.equal(result.recommendation.type, 'timeline');
  assert.equal(result.recommendation.profile, 'migration-plan');
});

test('advisor selects layers when enforcement placement carries the decision', () => {
  // Given an engineering question about responsibility and control placement
  const task = 'Show application layers and where authorization controls are enforced';

  // When Diago selects the smallest supported view
  const result = advise(task);

  // Then it chooses the native layers profile
  assert.equal(result.recommendation.type, 'layers');
  assert.equal(result.recommendation.profile, 'control-enforcement');
});

test('advice returns schema v2 selection context and a bounded native budget', () => {
  // Given explicit repository, audience, and destination context
  const context = {
    sourceKind: 'repository',
    audienceDetail: 'technical',
    destination: 'architecture-review',
  };

  // When advice is created for a request flow
  const result = advise('Trace an API request and retry response', context);

  // Then the machine contract carries selection and context fields
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.source.kind, 'repository');
  assert.equal(result.audience.detail, 'technical');
  assert.equal(result.destination, 'architecture-review');
  assert.equal(result.recommendation.pattern, 'ordered-interaction-response');
  assert.equal(result.recommendation.profile, 'request-walkthrough');
  assert.deepEqual(result.recommendation.budget, {
    participants: 6,
    messages: 16,
    conditionalSegments: 2,
  });
});
