import { DIAGRAM_TYPES, getDiagramType } from './diagram-catalog.mjs';

export class UnsupportedPlanVersionError extends Error {
  constructor(version) {
    super(`Unsupported diagram plan schema version "${version}". Expected 1 or 2.`);
    this.name = 'UnsupportedPlanVersionError';
    this.version = version;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function legacyRenderer(type) {
  if (DIAGRAM_TYPES.includes(type)) return getDiagramType(type);
  return {
    type: type ?? 'unknown',
    questionKind: 'unknown',
    profiles: ['unknown'],
    semanticPatterns: ['unknown'],
    budget: {},
  };
}

export function normalizePlan(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Diagram plan must be a JSON object.');
  }
  if (input.schemaVersion === 2) return clone(input);
  if (input.schemaVersion !== 1) throw new UnsupportedPlanVersionError(input.schemaVersion);

  const legacy = clone(input);
  const firstView = Array.isArray(legacy.views) ? legacy.views[0] : undefined;
  const renderer = legacyRenderer(firstView?.type);
  const profile = renderer.profiles[0];
  const pattern = renderer.semanticPatterns[0];

  return {
    schemaVersion: 2,
    task: legacy.task,
    goal: legacy.goal,
    source: {
      kind: 'prompt',
      scope: 'Legacy schema-v1 plan input',
      references: [],
    },
    audience: {
      role: legacy.audience,
      detail: 'technical',
    },
    selection: {
      questionKind: renderer.questionKind,
      semanticPattern: pattern,
      renderer: firstView?.type ?? 'unknown',
      profile,
      rationale: 'Compatibility defaults inferred from the primary schema-v1 view.',
    },
    scope: legacy.scope,
    evidence: {
      facts: legacy.evidence?.facts ?? [],
      assumptions: legacy.evidence?.assumptions ?? [],
      recommendations: legacy.evidence?.recommendations ?? [],
      superseded: [],
    },
    complexity: {
      detail: 'balanced',
      budget: renderer.budget,
      decomposition: 'single',
    },
    views: (legacy.views ?? []).map((view, index) => {
      const viewRenderer = legacyRenderer(view.type);
      return {
        type: view.type,
        profile: viewRenderer.profiles[0],
        role: index === 0 ? 'primary' : 'detail',
        question: view.question,
        focus: view.focus ?? [],
      };
    }),
    fidelity: {
      merged: [],
      collapsed: [],
      omitted: [],
      preserved: [],
    },
    constraints: legacy.constraints ?? [],
    output: {
      format: legacy.output?.format ?? 'standalone-html',
      quality: legacy.output?.quality ?? 'showcase',
      destination: 'engineering-review',
    },
  };
}
