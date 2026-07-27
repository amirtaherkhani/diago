#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fromRoot } from '../lib/paths.mjs';

const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(fromRoot(relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function validateSkill(name) {
  const file = fromRoot('skills', name, 'SKILL.md');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  check(lines.length < 500, `skills/${name}/SKILL.md must stay under 500 lines.`);
  check(!content.includes('[TODO:'), `skills/${name}/SKILL.md contains a TODO placeholder.`);
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  check(Boolean(match), `skills/${name}/SKILL.md is missing YAML frontmatter.`);
  if (!match) return;
  const keys = match[1]
    .split(/\r?\n/)
    .filter((line) => /^[a-z]/.test(line))
    .map((line) => line.split(':', 1)[0]);
  check(keys.join(',') === 'name,description', `skills/${name}/SKILL.md frontmatter must contain only name and description.`);
  check(match[1].includes(`name: ${name}`), `skills/${name}/SKILL.md name must match its directory.`);
}

const codexManifest = readJson('.codex-plugin/plugin.json');
const claudeManifest = readJson('.claude-plugin/plugin.json');
const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
const codexMarketplace = readJson('.agents/plugins/marketplace.json');
const upstreams = readJson('vendor/upstreams.lock.json');
readJson('package.json');
readJson('schemas/diagram-plan.schema.json');
readJson('schemas/advice.schema.json');
readJson('knowledge/diagram-recipes.json');
readJson('examples/checkout-feature.diagram-plan.json');
readJson('examples/plugin-request.architecture.json');

check(codexManifest?.name === 'engineering-diagram-toolkit', 'Codex plugin name is incorrect.');
check(codexManifest?.version === '0.1.0', 'Codex plugin version must match the release.');
check(codexManifest?.skills === './skills/', 'Codex skills path must be ./skills/.');
check(claudeManifest?.name === codexManifest?.name, 'Claude and Codex plugin names must match.');
check(claudeManifest?.version === codexManifest?.version, 'Claude and Codex plugin versions must match.');
check(claudeMarketplace?.plugins?.[0]?.source === './', 'Claude marketplace must load the repository-root plugin.');
check(codexMarketplace?.plugins?.[0]?.source?.path === './', 'Codex marketplace must load the repository-root plugin.');
check(codexMarketplace?.plugins?.[0]?.policy?.installation === 'AVAILABLE', 'Codex marketplace installation policy is required.');
check(codexMarketplace?.plugins?.[0]?.policy?.authentication === 'ON_INSTALL', 'Codex marketplace authentication policy is required.');

for (const [name, source] of Object.entries(upstreams?.sources ?? {})) {
  check(/^[0-9a-f]{40}$/.test(source.commit), `${name} must be pinned to a full commit SHA.`);
  check(fs.existsSync(fromRoot(source.path)), `${name} snapshot is missing at ${source.path}.`);
}

validateSkill('engineering-diagram');
validateSkill('review-diagram');

for (const relativePath of [
  'vendor/archify/bin/archify.mjs',
  'vendor/archify/LICENSE',
  'vendor/architecture-diagram-skill/LICENSE',
  'vendor/ui-ux-pro-max-skill/LICENSE',
  'docs/index.html',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
]) {
  check(fs.existsSync(fromRoot(relativePath)), `${relativePath} is required.`);
}

if (errors.length) {
  console.error(errors.map((message) => `✗ ${message}`).join('\n'));
  process.exit(1);
}

console.log('✓ Repository structure, manifests, skills, JSON, and upstream pins are valid.');
