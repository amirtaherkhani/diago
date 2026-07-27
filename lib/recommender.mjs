import fs from 'node:fs';
import { fromRoot } from './paths.mjs';

const recipes = JSON.parse(
  fs.readFileSync(fromRoot('knowledge', 'diagram-recipes.json'), 'utf8'),
);

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
  const tokens = tokenize(query);
  let score = 0;

  for (const keyword of recipe.keywords) {
    const normalized = keyword.toLowerCase();
    if (normalized.includes(' ') && query.toLowerCase().includes(normalized)) score += 4;
    else if (tokens.has(normalized)) score += 2;
  }

  for (const signal of recipe.signals) {
    if (query.toLowerCase().includes(signal.toLowerCase())) score += 3;
  }

  return score;
}

export function advise(query) {
  const ranked = recipes
    .map((recipe) => ({ recipe, score: scoreRecipe(query, recipe) }))
    .sort((a, b) => b.score - a.score || a.recipe.id.localeCompare(b.recipe.id));

  const fallback = recipes.find((recipe) => recipe.id === 'feature-architecture');
  const primary = ranked[0].score > 0 ? ranked[0].recipe : fallback;
  const alternatives = ranked
    .filter(({ recipe, score }) => recipe.id !== primary.id && score > 0)
    .slice(0, 2)
    .map(({ recipe }) => ({
      type: recipe.type,
      view: recipe.view,
      useWhen: recipe.useWhen,
    }));

  return {
    schemaVersion: 1,
    query,
    recommendation: {
      type: primary.type,
      view: primary.view,
      question: primary.question,
      why: primary.why,
      include: primary.include,
      avoid: primary.avoid,
      quality: 'showcase',
    },
    alternatives,
    evidenceChecklist: [
      'Confirm the named environment, branch, and version.',
      'Link important nodes and edges to code, contracts, runtime evidence, or an explicit user statement.',
      'Separate verified facts, assumptions, and recommendations.',
    ],
    suggestedPrompt: `Create a ${primary.type} diagram that answers: "${primary.question}" for: ${query}`,
  };
}

export function formatAdvice(result) {
  const lines = [
    `${result.recommendation.type.toUpperCase()} · ${result.recommendation.view}`,
    result.recommendation.why,
    '',
    `Question: ${result.recommendation.question}`,
    `Include: ${result.recommendation.include.join(', ')}`,
    `Avoid: ${result.recommendation.avoid.join(', ')}`,
  ];

  if (result.alternatives.length) {
    lines.push('', 'Alternatives:');
    for (const alternative of result.alternatives) {
      lines.push(`- ${alternative.type}: ${alternative.useWhen}`);
    }
  }

  return lines.join('\n');
}
