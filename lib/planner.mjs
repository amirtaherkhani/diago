import { getDiagramType } from './diagram-catalog.mjs';
import { advise } from './recommender.mjs';

const SOURCE_SCOPES = {
  prompt: 'User-provided task statement',
  repository: 'User-selected repository scope',
  conversation: 'Accessible conversation window',
  mixed: 'Mixed evidence sources',
};

const AUDIENCE_ROLES = {
  technical: 'software engineers and technical reviewers',
  mixed: 'engineering and product reviewers',
  executive: 'technical decision makers',
};

export function createPlan(task, context = {}) {
  const guidance = advise(task, context);
  const recommendation = guidance.recommendation;
  const renderer = getDiagramType(recommendation.type);
  return {
    schemaVersion: 2,
    task,
    goal: recommendation.question,
    source: {
      kind: guidance.source.kind,
      scope: SOURCE_SCOPES[guidance.source.kind],
      references: [],
    },
    audience: {
      role: AUDIENCE_ROLES[guidance.audience.detail],
      detail: guidance.audience.detail,
    },
    selection: {
      questionKind: renderer.questionKind,
      semanticPattern: recommendation.pattern,
      renderer: recommendation.type,
      profile: recommendation.profile,
      rationale: recommendation.rationale,
    },
    scope: {
      in: recommendation.include,
      out: recommendation.avoid,
    },
    evidence: {
      facts: [],
      assumptions: [],
      recommendations: [],
      superseded: [],
    },
    complexity: {
      detail: 'balanced',
      budget: recommendation.budget,
      decomposition: recommendation.decomposition,
    },
    views: [
      {
        type: recommendation.type,
        profile: recommendation.profile,
        role: 'primary',
        question: recommendation.question,
        focus: recommendation.include,
      },
    ],
    fidelity: {
      merged: [],
      collapsed: [],
      omitted: [],
      preserved: [],
    },
    constraints: [
      'Do not expose credentials, customer data, private hostnames, or local absolute paths.',
      'Distinguish facts, assumptions, recommendations, and superseded decisions.',
    ],
    output: {
      format: 'standalone-html',
      quality: 'showcase',
      destination: guidance.destination,
    },
  };
}
