import { ARROW_TYPES, arrowAssets } from './arrows.mjs';
import { themeControl, themeControlCss } from './renderers/theme-control.mjs';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { fromRoot } from './paths.mjs';
import { escapeHtml } from './renderers/shared.mjs';

const statuses = ['verified', 'assumption', 'proposed'];
const limits = Object.freeze({ components: 200, evidence: 400, views: 40, nodesPerView: 12, edgesPerView: 20, depth: 6, bytes: 256_000 });
function fail(message) { throw new TypeError(`Explorer: ${message}`); }
function object(value, keys, at) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${at} must be an object`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${at}.${key} is unknown`);
}
function text(value, at, max = 1000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${at} must contain 1–${max} characters`);
}
function array(value, at, max, min = 0) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(`${at} must contain ${min}–${max} items`);
}
function index(items, at) {
  const map = new Map();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(item.id)) fail(`${at}: invalid id`);
    if (map.has(item.id)) fail(`${at}: duplicate id ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}
function references(value, map, at, max = 20) {
  array(value, at, max);
  if (new Set(value).size !== value.length) fail(`${at}: duplicate references`);
  for (const id of value) if (!map.has(id)) fail(`${at}: unknown reference ${String(id)}`);
}

export function validateExplorer(document) {
  object(document, ['schemaVersion', 'title', 'summary', 'root', 'components', 'evidence', 'views'], 'document');
  const serialized = JSON.stringify(document);
  if (Buffer.byteLength(serialized) > limits.bytes) fail(`input exceeds ${limits.bytes} bytes`);
  if (document.schemaVersion !== 1) fail('schemaVersion must be 1');
  text(document.title, 'title', 120);
  if (document.summary !== undefined) text(document.summary, 'summary');
  array(document.components, 'components', limits.components, 1);
  array(document.views, 'views', limits.views, 1);
  array(document.evidence, 'evidence', limits.evidence);
  const components = index(document.components, 'components');
  const views = index(document.views, 'views');
  const evidence = index(document.evidence, 'evidence');
  if (!views.has(document.root)) fail('root must reference a view');
  for (const item of document.evidence) {
    object(item, ['id', 'source', 'note'], `evidence.${item.id}`);
    text(item.source, 'evidence.source', 500);
    if (item.note !== undefined) text(item.note, 'evidence.note');
  }
  const checkStatus = (item, at) => {
    if (!statuses.includes(item.status)) fail(`${at}.status must be ${statuses.join(', ')}`);
    references(item.evidence === undefined ? [] : item.evidence, evidence, `${at}.evidence`);
    if (item.status === 'verified' && !item.evidence?.length) fail(`${at}: verified claims require evidence`);
  };
  for (const item of document.components) {
    object(item, ['id', 'label', 'description', 'path', 'status', 'evidence', 'detail'], `components.${item.id}`);
    text(item.label, 'component.label', 80);
    if (item.description !== undefined) text(item.description, 'component.description', 2000);
    if (item.path !== undefined) text(item.path, 'component.path', 500);
    checkStatus(item, `component.${item.id}`);
    if (item.detail !== undefined && !views.has(item.detail)) fail(`component.${item.id}: unknown detail view`);
  }
  const used = new Set();
  for (const view of document.views) {
    object(view, ['id', 'title', 'question', 'nodes', 'edges'], `views.${view.id}`);
    text(view.title, 'view.title', 120);
    if (view.question !== undefined) text(view.question, 'view.question', 500);
    references(view.nodes, components, `view.${view.id}.nodes`, limits.nodesPerView);
    if (!view.nodes.length) fail(`view.${view.id} must have nodes`);
    view.nodes.forEach(id => used.add(id));
    array(view.edges, `view.${view.id}.edges`, limits.edgesPerView);
    for (const edge of view.edges) {
      object(edge, ['from', 'to', 'label', 'status', 'evidence', 'arrow'], 'edge');
      if (!view.nodes.includes(edge.from) || !view.nodes.includes(edge.to)) fail(`view.${view.id}: edge endpoints must belong to the view`);
      if (edge.from === edge.to) fail(`view.${view.id}: self edges need a dedicated lifecycle view`);
      if (edge.arrow !== undefined && !ARROW_TYPES.includes(edge.arrow)) fail('edge.arrow must be a supported Diago arrow type');
      text(edge.label, 'edge.label', 120);
      checkStatus(edge, 'edge');
    }
  }
  if (used.size !== components.size) fail('every component must appear in a view');
  // The navigation graph must be acyclic and bounded; relationship cycles are allowed.
  const depths = new Map(), active = new Set();
  function depth(id) {
    if (active.has(id)) fail(`detail cycle at ${id}`);
    if (depths.has(id)) return depths.get(id);
    active.add(id);
    let value = 1;
    for (const node of views.get(id).nodes) {
      const child = components.get(node).detail;
      if (child) value = Math.max(value, 1 + depth(child));
    }
    active.delete(id);
    if (value > limits.depth) fail(`detail depth exceeds ${limits.depth}`);
    depths.set(id, value);
    return value;
  }
  for (const id of views.keys()) depth(id);
  const referencesCount = document.views.reduce((sum, view) => sum + view.nodes.length, 0);
  const expandedBytes = Buffer.byteLength(JSON.stringify({ ...document, components: undefined,
    views: document.views.map(view => ({ ...view, nodes: view.nodes.map(id => components.get(id)) })) }));
  return { ok: true, kind: 'architecture-explorer', components: components.size, views: views.size,
    evidence: evidence.size, inputBytes: Buffer.byteLength(serialized), expandedInputBytes: expandedBytes,
    reusedComponentReferences: referencesCount - components.size, limits };
}

export function buildExplorerHtml(document) {
  validateExplorer(document);
  const css = fs.readFileSync(fromRoot('lib/explorer/viewer.css'), 'utf8');
  const js = fs.readFileSync(fromRoot('lib/explorer/viewer.js'), 'utf8');
  const logo = fs.readFileSync(fromRoot('assets/logo.svg'), 'utf8');
  const data = JSON.stringify(document).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(document.title)} · Diago</title><style>${css}\n${themeControlCss}</style></head><body>
<header class="topbar"><a class="brand" href="#" aria-label="Diago overview">${logo}<span>Diago<span class="brand-sub">Architecture explorer</span></span></a><div class="tools"><div class="diago-theme-group">${themeControl('theme')}</div><button id="download">Source JSON ↓</button></div></header>
<div class="workspace"><nav class="views" aria-label="Architecture views"><p class="eyebrow">PROJECT MAP</p><h1 dir="auto"></h1><p id="summary" dir="auto"></p><button id="nav-toggle" aria-expanded="false" aria-controls="navigation-controls">Views &amp; search</button><div id="navigation-controls"><label for="search">Find a component</label><input id="search" type="search" placeholder="Name or source path…"><div id="search-results" aria-live="polite"></div><p class="eyebrow">PERSPECTIVES</p><div id="view-list"></div></div><p class="nav-note">Explore the structure.<br>Inspect the evidence.</p></nav>
<main><nav id="breadcrumbs" aria-label="Breadcrumb"></nav><div class="view-heading"><div><p class="eyebrow">CONNECTED ARCHITECTURE</p><h2 id="view-title" tabindex="-1" dir="auto"></h2><p id="question" dir="auto"></p></div><span id="count" class="count"></span></div>
<div class="canvas-tools"><span>Select a component to inspect its sources.</span><div><button id="zoom-out" aria-label="Zoom out">−</button><button id="fit">Fit</button><button id="zoom-in" aria-label="Zoom in">+</button></div></div>
<section id="canvas" aria-label="Architecture diagram"><svg id="graph" role="group" aria-label="Components and relationships"></svg></section>
<div class="legend"><span class="verified">● Verified</span><span class="assumption">◌ Assumption</span><span class="proposed">◇ Proposed</span></div>
<section class="relationships"><h3>Relationships <span id="edge-count"></span></h3><div id="relationships"></div></section>
<footer>Diago · Standalone, offline HTML · Evidence status is supplied by the author.</footer></main>
<aside id="inspector" aria-label="Evidence inspector"><div class="inspector-top"><p class="eyebrow">INSPECTOR</p><button id="close" aria-label="Close inspector">×</button></div><div id="details" aria-live="polite"><h2>Every connection has a story.</h2><p>Select a component or relationship to read its responsibility and evidence.</p></div></aside></div>
<script id="explorer-data" type="application/json">${data}</script><script>${js}</script>${arrowAssets('explorer')}</body></html>`;
}

export function renderExplorer(document, outputPath, overwrite = false) {
  const validation = validateExplorer(document);
  const html = buildExplorerHtml(document);
  fs.writeFileSync(outputPath, html, { flag: overwrite ? 'w' : 'wx' });
  return { ok: true, kind: 'architecture-explorer', output: outputPath,
    artifact: { bytes: Buffer.byteLength(html), sha256: createHash('sha256').update(html).digest('hex') }, validation };
}
