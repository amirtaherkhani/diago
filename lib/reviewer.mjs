const allowedTypes = new Set([
  'architecture',
  'workflow',
  'sequence',
  'dataflow',
  'lifecycle',
]);

function finding(severity, code, message, path) {
  return { severity, code, message, path };
}

export function reviewPlan(plan) {
  const findings = [];

  if (plan?.schemaVersion !== 1) {
    findings.push(finding('blocker', 'schema-version', 'schemaVersion must be 1.', 'schemaVersion'));
  }

  for (const field of ['task', 'goal', 'audience']) {
    if (typeof plan?.[field] !== 'string' || plan[field].trim().length < 6) {
      findings.push(finding('high', `missing-${field}`, `${field} must be a meaningful sentence.`, field));
    }
  }

  if (!Array.isArray(plan?.views) || plan.views.length === 0) {
    findings.push(finding('blocker', 'missing-view', 'At least one diagram view is required.', 'views'));
  } else {
    plan.views.forEach((view, index) => {
      if (!allowedTypes.has(view?.type)) {
        findings.push(finding('high', 'invalid-view-type', `Unknown diagram type "${view?.type}".`, `views[${index}].type`));
      }
      if (typeof view?.question !== 'string' || !view.question.trim()) {
        findings.push(finding('high', 'missing-view-question', 'Each view needs one explicit question.', `views[${index}].question`));
      }
    });
  }

  const evidence = plan?.evidence;
  if (!evidence || !Array.isArray(evidence.facts) || !Array.isArray(evidence.assumptions) || !Array.isArray(evidence.recommendations)) {
    findings.push(finding('blocker', 'evidence-contract', 'Evidence must separate facts, assumptions, and recommendations.', 'evidence'));
  } else {
    evidence.facts.forEach((fact, index) => {
      if (!fact?.statement || !fact?.source) {
        findings.push(finding('high', 'unsupported-fact', 'Every fact needs a statement and source.', `evidence.facts[${index}]`));
      }
    });
    if (evidence.facts.length === 0) {
      findings.push(finding('medium', 'no-facts', 'No verified facts are recorded yet.', 'evidence.facts'));
    }
  }

  if (!Array.isArray(plan?.scope?.in) || !Array.isArray(plan?.scope?.out)) {
    findings.push(finding('medium', 'scope-boundary', 'Define both included and excluded scope.', 'scope'));
  }

  const weights = { blocker: 35, high: 20, medium: 10, low: 3 };
  const score = Math.max(
    0,
    100 - findings.reduce((total, item) => total + weights[item.severity], 0),
  );

  return {
    schemaVersion: 1,
    ok: findings.every((item) => !['blocker', 'high'].includes(item.severity)),
    score,
    findings,
  };
}
