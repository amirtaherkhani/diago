import fs from 'node:fs';
import path from 'node:path';
import { fromRoot } from './paths.mjs';

export const ARROW_TYPES = Object.freeze(['directed', 'response', 'event', 'dependency', 'bidirectional', 'association']);
export const ARROW_RULES = Object.freeze({
  architecture: { collection: 'connections', allowed: ARROW_TYPES, default: 'directed' },
  sequence: { collection: 'messages', allowed: ['directed', 'response', 'event'], default: 'directed' },
  workflow: { collection: 'edges', allowed: ['directed', 'response', 'event'], default: 'directed' },
  dataflow: { collection: 'flows', allowed: ['directed', 'response', 'event'], default: 'directed' },
  lifecycle: { collection: 'transitions', allowed: ['directed'], default: 'directed' },
  'data-model': { collection: 'relationships', allowed: ['association'], default: 'association' },
  timeline: { collection: 'dependencies', allowed: ['dependency'], default: 'dependency' },
  layers: { collection: 'dependencies', allowed: ['dependency'], default: 'dependency' },
  dependency: { collection: 'edges', allowed: ['dependency'], default: 'dependency' },
});

export function validateArrows(type, diagram) {
  const rule = ARROW_RULES[type];
  if (!rule || !Array.isArray(diagram?.[rule.collection])) return;
  diagram[rule.collection].forEach((edge, i) => {
    if (edge?.arrow !== undefined && !rule.allowed.includes(edge.arrow)) {
      throw new TypeError(`${rule.collection}[${i}].arrow must be one of: ${rule.allowed.join(', ')}.`);
    }
    if (type === 'sequence' && edge?.variant === 'return' && edge.arrow !== undefined && edge.arrow !== 'response') {
      throw new TypeError(`messages[${i}].arrow conflicts with the return variant; use response.`);
    }
  });
}

export function arrowAttrs(edge, fallback = 'directed') {
  const type = edge.arrow ?? fallback;
  if (!ARROW_TYPES.includes(type)) throw new TypeError('Unknown arrow type.');
  return `data-arrow-type="${type}"`;
}

export function arrowAssets(type) {
  // Only catalog-controlled model names enter this static payload.
  if (!Object.hasOwn(ARROW_RULES, type) && !['fishbone', 'security-matrix', 'explorer'].includes(type)) throw new TypeError('Unknown arrow guide model.');
  return `<style>${fs.readFileSync(fromRoot('lib/arrows/viewer.css'), 'utf8')}</style><script data-diago-arrow-model="${type}">${fs.readFileSync(fromRoot('lib/arrows/viewer.js'), 'utf8')}</script>`;
}

function replaceRequired(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`Bundled arrow adapter contract changed: ${path.basename(file)}`);
  fs.writeFileSync(file, original.replaceAll(before, after));
}

// Extend only the disposable runtime. The original JSON (including arrow) is
// retained for rendering and provenance; the generated upstream schema sees a
// clone without the Diago-only field after canonical arrow validation.
export function prepareArchifyArrows(directory) {
  // Structural associations must not become directed reachability or routes.
  const template = path.join(directory, 'assets/template.html');
  replaceRequired(template, 'if (!from || !to || seen[key]) return;',
    "if (!from || !to || seen[key] || edge.getAttribute('data-arrow-type') === 'association') return;");
  replaceRequired(template, 'if (!byId[from] || !byId[to] || from === to) return;',
    "if (!byId[from] || !byId[to] || from === to || edge.getAttribute('data-arrow-type') === 'association') return;");
  replaceRequired(path.join(directory, 'renderers/shared/validator.mjs'),
    'export function validateSchema(diagramType, data) {',
    `export function validateSchema(diagramType, data) {
  data = JSON.parse(JSON.stringify(data));
  const collections = { architecture: 'connections', sequence: 'messages', workflow: 'edges', dataflow: 'flows', lifecycle: 'transitions' };
  const edges = data?.[collections[diagramType]];
  if (Array.isArray(edges)) for (const edge of edges) if (edge && typeof edge === 'object') delete edge.arrow;`);
  const cli = path.join(directory, 'renderers/shared/cli.mjs');
  replaceRequired(cli, 'function focusEdgeAttrs(from, to, label, key, id)', "function focusEdgeAttrs(from, to, label, key, id, arrow = 'directed')");
  replaceRequired(cli, '${named}${keyed}${identified}`', '${named}${keyed}${identified} data-arrow-type="${esc(arrow)}"`');
  for (const [file, variable, defaultType] of [
    ['architecture/render-architecture.mjs', 'conn', "'directed'"],
    ['sequence/render-sequence.mjs', 'message', "(message.variant === 'return' ? 'response' : 'directed')"],
    ['workflow/workflow-compiler.mjs', 'edge', "'directed'"],
    ['dataflow/render-dataflow.mjs', 'flow', "'directed'"],
    ['lifecycle/render-lifecycle.mjs', 'transition', "'directed'"],
  ]) {
    const label = variable === 'transition' ? 'transition.label || transition.note' : `${variable}.label`;
    const original = `focusEdgeAttrs(${variable}.from, ${variable}.to, ${label}, index, ${variable}.id)`;
    replaceRequired(path.join(directory, 'renderers', file), original,
      original.slice(0, -1) + `, ${variable}.arrow || ${defaultType})`);
  }
}
