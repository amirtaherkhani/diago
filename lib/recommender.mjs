import fs from 'node:fs';
import { getDiagramType } from './diagram-catalog.mjs';
import { fromRoot } from './paths.mjs';

const recipes = JSON.parse(
  fs.readFileSync(fromRoot('knowledge', 'diagram-recipes.json'), 'utf8'),
);
const SOURCE_KINDS = ['prompt', 'repository', 'conversation', 'mixed'];
const AUDIENCE_DETAILS = ['technical', 'mixed', 'executive'];

function tokenize(value) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

function scoreRecipe(query, recipe) {
  const normalizedQuery = query.toLowerCase();
  const tokens = tokenize(query);
  let score = 0;

  for (const keyword of recipe.keywords) {
    const normalized = keyword.toLowerCase();
    if (normalized.includes(' ') && normalizedQuery.includes(normalized)) score += 4;
    else if (tokens.has(normalized)) score += 2;
  }

  for (const signal of recipe.signals) {
    const normalized = signal.toLowerCase();
    if (normalized.includes(' ') && normalizedQuery.includes(normalized)) score += 5;
    else if (tokens.has(normalized)) score += 5;
  }

  return score;
}

function normalizeContext(context = {}) {
  const sourceKind = context.sourceKind ?? 'prompt';
  const audienceDetail = context.audienceDetail ?? 'technical';
  const destination = context.destination ?? 'engineering-review';
  if (!SOURCE_KINDS.includes(sourceKind)) {
    throw new TypeError(`sourceKind must be one of: ${SOURCE_KINDS.join(', ')}.`);
  }
  if (!AUDIENCE_DETAILS.includes(audienceDetail)) {
    throw new TypeError(`audienceDetail must be one of: ${AUDIENCE_DETAILS.join(', ')}.`);
  }
  if (typeof destination !== 'string' || !destination.trim()) {
    throw new TypeError('destination must be a non-empty string.');
  }
  return { sourceKind, audienceDetail, destination: destination.trim() };
}

export function advise(query, context = {}) {
  const normalized = normalizeContext(context);
  const ranked = recipes
    .map((recipe) => ({ recipe, score: scoreRecipe(query, recipe) }))
    .sort((left, right) => right.score - left.score || left.recipe.id.localeCompare(right.recipe.id));

  const fallback = recipes.find((recipe) => recipe.id === 'feature-architecture');
  const primary = ranked[0].score > 0 ? ranked[0].recipe : fallback;
  const renderer = getDiagramType(primary.type);
  const alternatives = ranked
    .filter(({ recipe, score }) => recipe.id !== primary.id && score > 0)
    .filter(({ recipe }) => getDiagramType(recipe.type).supported)
    .slice(0, 2)
    .map(({ recipe }) => ({
      type: recipe.type,
      profile: recipe.profile,
      pattern: recipe.semanticPattern,
      view: recipe.view,
      useWhen: recipe.useWhen,
    }));

  return {
    schemaVersion: 2,
    query,
    source: { kind: normalized.sourceKind },
    audience: { detail: normalized.audienceDetail },
    destination: normalized.destination,
    recommendation: {
      type: primary.type,
      view: primary.view,
      profile: primary.profile,
      pattern: primary.semanticPattern,
      question: primary.question,
      rationale: primary.why,
      why: primary.why,
      include: primary.include,
      avoid: primary.avoid,
      budget: renderer.budget,
      decomposition: 'single',
      quality: 'showcase',
    },
    alternatives,
    evidenceChecklist: [
      'Confirm the named environment, branch, and version.',
      'Link important nodes and edges to code, contracts, runtime evidence, or an explicit user statement.',
      'Separate verified facts, assumptions, recommendations, and superseded decisions.',
    ],
    suggestedPrompt: `Create a ${primary.type} diagram that answers: "${primary.question}" for: ${query}`,
  };
}

export function formatAdvice(result) {
  const recommendation = result.recommendation;
  const lines = [
    `${recommendation.type.toUpperCase()} · ${recommendation.view}`,
    recommendation.rationale,
    '',
    `Question: ${recommendation.question}`,
    `Profile: ${recommendation.profile}`,
    `Pattern: ${recommendation.pattern}`,
    `Include: ${recommendation.include.join(', ')}`,
    `Avoid: ${recommendation.avoid.join(', ')}`,
  ];

  if (result.alternatives.length) {
    lines.push('', 'Alternatives:');
    for (const alternative of result.alternatives) {
      lines.push(`- ${alternative.type} (${alternative.profile}): ${alternative.useWhen}`);
    }
  }

  return lines.join('\n');
}
