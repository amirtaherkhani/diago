#!/usr/bin/env node

import fs from 'node:fs';
import { fromRoot } from '../lib/paths.mjs';

const lock = JSON.parse(fs.readFileSync(fromRoot('vendor', 'upstreams.lock.json'), 'utf8'));
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'diago',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }
  return response.json();
}

const tags = await github('/repos/tt-a1i/archify/tags?per_page=1');
const architecture = await github('/repos/konraddzbik/architecture-diagram-skill/commits/main');
const uiUx = await github('/repos/nextlevelbuilder/ui-ux-pro-max-skill/commits/main');
const diagramDesign = await github('/repos/cathrynlavery/diagram-design/commits/main');

const latest = {
  archify: { ref: tags[0].name, commit: tags[0].commit.sha },
  'architecture-diagram-skill': { ref: 'main', commit: architecture.sha },
  'ui-ux-pro-max-skill': { ref: 'main', commit: uiUx.sha },
  'diagram-design': { ref: 'main', commit: diagramDesign.sha },
};

const result = Object.fromEntries(
  Object.entries(latest).map(([name, remote]) => [
    name,
    {
      current: {
        ref: lock.sources[name].ref,
        commit: lock.sources[name].commit,
      },
      latest: remote,
      changed: lock.sources[name].commit !== remote.commit,
    },
  ]),
);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const [name, status] of Object.entries(result)) {
    console.log(`${status.changed ? 'UPDATE' : 'CURRENT'} ${name} ${status.current.ref} → ${status.latest.ref}`);
  }
}
