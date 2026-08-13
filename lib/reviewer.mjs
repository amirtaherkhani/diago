import { DIAGRAM_TYPES, getDiagramType } from './diagram-catalog.mjs';
import { normalizePlan, UnsupportedPlanVersionError } from './plan-compat.mjs';

const weights = { blocker: 35, high: 20, medium: 10, low: 3 };
const unsafeAbsolutePath = /^(?:\/(?:Users|home|private|tmp)\/|[A-Za-z]:\\)/;
const exposedSecret = /(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/i;

function finding(severity, code, message, path) {
  return { severity, code, message, path };
}

function meaningful(value) {
  return typeof value === 'string' && value.trim().length >= 6;
}

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeSourceLabel(value) {
  return typeof value === 'string'
    && !unsafeAbsolutePath.test(value)
    && !exposedSecret.test(value);
}

function finish(findings) {
  const score = Math.max(
    0,
    100 - findings.reduce((total, item) => total + weights[item.severity], 0),
  );
  return {
    schemaVersion: 2,
    ok: findings.every((item) => !['blocker', 'high'].includes(item.severity)),
    score,
    findings,
  };
}

function reviewEvidence(plan, findings) {
  const evidence = plan.evidence;
  const lanes = ['facts', 'assumptions', 'recommendations', 'superseded'];
  if (!evidence || lanes.some((lane) => !Array.isArray(evidence[lane]))) {
    findings.push(finding('blocker', 'evidence-contract', 'Evidence must separate facts, assumptions, recommendations, and superseded decisions.', 'evidence'));
    return;
  }

  for (const [lane, claims] of lanes.map((lane) => [lane, evidence[lane]])) {
    claims.forEach((claim, index) => {
      const path = `evidence.${lane}[${index}]`;
      if (!meaningful(claim?.statement) || typeof claim?.source !== 'string' || !claim.source.trim()) {
        const code = lane === 'facts' ? 'unsupported-fact' : 'unsupported-claim';
        findings.push(finding('high', code, 'Every evidence claim needs a meaningful statement and source.', path));
      } else if (!safeSourceLabel(claim.source)) {
        findings.push(finding('blocker', 'unsafe-source-label', 'Public evidence labels must not expose local absolute paths or secret values.', `${path}.source`));
      }
    });
  }
  if (evidence.facts.length === 0) {
    findings.push(finding('medium', 'no-facts', 'No verified facts are recorded yet.', 'evidence.facts'));
  }
}

function reviewViews(plan, findings) {
  if (!Array.isArray(plan.views) || plan.views.length === 0) {
    findings.push(finding('blocker', 'missing-view', 'At least one diagram view is required.', 'views'));
    return;
  }

  let primaryCount = 0;
  plan.views.forEach((view, index) => {
    const basePath = `views[${index}]`;
    if (!DIAGRAM_TYPES.includes(view?.type)) {
      findings.push(finding('high', 'invalid-view-type', `Unknown diagram type "${view?.type}".`, `${basePath}.type`));
    } else if (!getDiagramType(view.type).profiles.includes(view.profile)) {
      findings.push(finding('high', 'renderer-profile-mismatch', `Profile "${view.profile}" is not supported by ${view.type}.`, `${basePath}.profile`));
    }
    if (!['primary', 'detail'].includes(view?.role)) {
      findings.push(finding('high', 'invalid-view-role', 'Each view role must be primary or detail.', `${basePath}.role`));
    }
    if (view?.role === 'primary') primaryCount += 1;
    if (!meaningful(view?.question)) {
      findings.push(finding('high', 'missing-view-question', 'Each view needs one explicit question.', `${basePath}.question`));
    }
    if (!Array.isArray(view?.focus)) {
      findings.push(finding('medium', 'missing-view-focus', 'Each view needs a bounded focus list.', `${basePath}.focus`));
    }
  });
  if (primaryCount !== 1) {
    findings.push(finding('high', 'primary-view-count', 'Exactly one primary view is required.', 'views'));
  }
}

function reviewSelection(plan, findings) {
  const primary = plan.views?.find((view) => view?.role === 'primary');
  if (!plan.selection || typeof plan.selection !== 'object') {
    findings.push(finding('blocker', 'missing-selection', 'A schema-v2 plan requires an explicit selection contract.', 'selection'));
    return;
  }
  if (primary && (plan.selection.renderer !== primary.type || plan.selection.profile !== primary.profile)) {
    findings.push(finding('high', 'selection-view-mismatch', 'Selection renderer and profile must match the primary view.', 'selection'));
  }
  for (const field of ['questionKind', 'semanticPattern', 'renderer', 'profile', 'rationale']) {
    if (typeof plan.selection[field] !== 'string' || !plan.selection[field].trim()) {
      findings.push(finding('high', `missing-selection-${field}`, `selection.${field} is required.`, `selection.${field}`));
    }
  }
}

function reviewComplexity(plan, findings) {
  const complexity = plan.complexity;
  if (!complexity || !['overview', 'balanced', 'detailed'].includes(complexity.detail)) {
    findings.push(finding('high', 'invalid-complexity-detail', 'Complexity detail must be overview, balanced, or detailed.', 'complexity.detail'));
  }
  if (
    !plainObject(complexity?.budget)
    || Object.keys(complexity.budget).length === 0
    || Object.values(complexity.budget).some((value) => !Number.isInteger(value) || value < 1)
  ) {
    findings.push(finding('high', 'invalid-complexity-budget', 'Every complexity budget value must be a positive integer.', 'complexity.budget'));
  }
  if (!['single', 'overview-detail'].includes(complexity?.decomposition)) {
    findings.push(finding('high', 'invalid-decomposition', 'Decomposition must be single or overview-detail.', 'complexity.decomposition'));
  }

  const fidelity = plan.fidelity;
  const lanes = ['merged', 'collapsed', 'omitted', 'preserved'];
  if (!fidelity || lanes.some((lane) => !Array.isArray(fidelity[lane]))) {
    findings.push(finding('blocker', 'fidelity-contract', 'Fidelity must record merged, collapsed, omitted, and preserved content.', 'fidelity'));
  } else if (complexity?.decomposition === 'overview-detail' && lanes.every((lane) => fidelity[lane].length === 0)) {
    findings.push(finding('high', 'missing-fidelity', 'Overview-detail decomposition must record what was reduced or preserved.', 'fidelity'));
  }
}

export function reviewPlan(input) {
  const findings = [];
  if (input?.schemaVersion === 1) {
    findings.push(finding('medium', 'schema-v1-compat', 'Schema v1 is accepted through compatibility normalization; generate schema v2 for new work.', 'schemaVersion'));
  }

  let plan;
  try {
    plan = normalizePlan(input);
  } catch (error) {
    if (error instanceof UnsupportedPlanVersionError || error instanceof TypeError) {
      findings.push(finding('blocker', 'schema-version', error.message, 'schemaVersion'));
      return finish(findings);
    }
    throw error;
  }

  for (const field of ['task', 'goal']) {
    if (!meaningful(plan[field])) {
      findings.push(finding('high', `missing-${field}`, `${field} must be a meaningful sentence.`, field));
    }
  }
  if (!meaningful(plan.audience?.role) || !['technical', 'mixed', 'executive'].includes(plan.audience?.detail)) {
    findings.push(finding('high', 'invalid-audience', 'Audience needs a meaningful role and supported detail level.', 'audience'));
  }
  if (!['prompt', 'repository', 'conversation', 'mixed'].includes(plan.source?.kind) || !meaningful(plan.source?.scope)) {
    findings.push(finding('high', 'invalid-source', 'Source needs a supported kind and meaningful scope.', 'source'));
  }
  if (!Array.isArray(plan.source?.references)) {
    findings.push(finding('high', 'invalid-source-references', 'Source references must be an array of public labels.', 'source.references'));
  } else {
    for (const [index, reference] of plan.source.references.entries()) {
      if (!safeSourceLabel(reference)) {
        findings.push(finding('blocker', 'unsafe-source-label', 'Public source references must not expose local absolute paths or secret values.', `source.references[${index}]`));
      }
    }
  }
  if (!Array.isArray(plan.scope?.in) || !Array.isArray(plan.scope?.out)) {
    findings.push(finding('medium', 'scope-boundary', 'Define both included and excluded scope.', 'scope'));
  }

  reviewViews(plan, findings);
  reviewSelection(plan, findings);
  reviewEvidence(plan, findings);
  reviewComplexity(plan, findings);
  return finish(findings);
}
