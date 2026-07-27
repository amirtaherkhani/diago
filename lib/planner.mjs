import { advise } from './recommender.mjs';

export function createPlan(task) {
  const guidance = advise(task);
  return {
    schemaVersion: 1,
    task,
    goal: guidance.recommendation.question,
    audience: 'software engineers and technical reviewers',
    scope: {
      in: guidance.recommendation.include,
      out: guidance.recommendation.avoid,
    },
    evidence: {
      facts: [],
      assumptions: [],
      recommendations: [],
    },
    views: [
      {
        type: guidance.recommendation.type,
        question: guidance.recommendation.question,
        focus: guidance.recommendation.include,
      },
    ],
    constraints: [
      'Do not expose credentials, customer data, or production identifiers.',
      'Distinguish facts, assumptions, and recommendations.',
    ],
    output: {
      format: 'standalone-html',
      quality: 'showcase',
    },
  };
}
