import assert from 'node:assert/strict';
import test from 'node:test';
import { parseContextArgs, parseNativeOptions } from '../lib/cli-options.mjs';

test('context options preserve the task and supported planning metadata', () => {
  // Given a task mixed with every supported planning option
  const args = [
    'Map',
    'checkout',
    '--source',
    'repository',
    '--audience',
    'mixed',
    '--destination',
    'design-review',
    '--out',
    'plan.json',
  ];

  // When the reusable context parser handles plan output
  const parsed = parseContextArgs(args, { allowOutput: true });

  // Then positional content and metadata remain distinct
  assert.deepEqual(parsed.positional, ['Map', 'checkout']);
  assert.deepEqual(parsed.context, {
    sourceKind: 'repository',
    audienceDetail: 'mixed',
    destination: 'design-review',
  });
  assert.equal(parsed.output, 'plan.json');
});

test('native options reject unsupported quality values', () => {
  // Given an unsupported native quality level
  const parse = () => parseNativeOptions(['diagram.json', '--quality', 'draft']);

  // When and then parsing validates the public renderer contract
  assert.throws(parse, /quality must be standard or showcase/);
});
