import { arrowAssets } from '../arrows.mjs';
import { walkthroughAssets } from './walkthrough.mjs';
import { themeControl } from './theme-control.mjs';
import { presentationCss, nativeThemeScript } from './presentation.mjs';

export class NativeDiagramValidationError extends Error {
  constructor(message, path = 'diagram') {
    super(`${path}: ${message}`);
    this.name = 'NativeDiagramValidationError';
    this.path = path;
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function wrapWords(value, maxCharacters, maxLines = 4) {
  const lines = [];
  for (const word of String(value).trim().split(/\s+/)) {
    const current = lines.at(-1);
    if (!current || `${current} ${word}`.length > maxCharacters) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1]}…`;
  return visible;
}

export function svgTextLines(lines, { x, y, lineHeight = 16, className = 'node-copy', anchor = 'start' }) {
  return lines.map((line, index) => (
    `<text class="${className}" x="${x}" y="${y + (index * lineHeight)}" text-anchor="${anchor}">${escapeHtml(line)}</text>`
  )).join('');
}

export function requireDocument(diagram, type) {
  if (!diagram || typeof diagram !== 'object' || Array.isArray(diagram)) {
    throw new NativeDiagramValidationError('must be a JSON object');
  }
  if (diagram.schema_version !== 1) {
    throw new NativeDiagramValidationError('schema_version must be 1', 'schema_version');
  }
  if (diagram.diagram_type !== type) {
    throw new NativeDiagramValidationError(`diagram_type must be "${type}"`, 'diagram_type');
  }
  if (typeof diagram.meta?.title !== 'string' || !diagram.meta.title.trim()) {
    throw new NativeDiagramValidationError('meta.title must be a non-empty string', 'meta.title');
  }
}

export function requireArray(value, path, limits = {}) {
  if (!Array.isArray(value)) {
    throw new NativeDiagramValidationError('must be an array', path);
  }
  if (limits.min !== undefined && value.length < limits.min) {
    throw new NativeDiagramValidationError(`must contain at least ${limits.min} item${limits.min === 1 ? '' : 's'}`, path);
  }
  if (limits.max !== undefined && value.length > limits.max) {
    const decomposition = limits.decomposition ? ' Use overview-detail decomposition.' : '';
    throw new NativeDiagramValidationError(`supports at most ${limits.max} ${limits.label ?? 'items'}.${decomposition}`, path);
  }
  return value;
}

export function requireString(value, path) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NativeDiagramValidationError('must be a non-empty string', path);
  }
  return value;
}

export function requireEnum(value, allowed, path) {
  if (!allowed.includes(value)) {
    throw new NativeDiagramValidationError(`must be one of: ${allowed.join(', ')}`, path);
  }
  return value;
}

export function requireUniqueIds(items, path) {
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const id = requireString(item?.id, `${path}[${index}].id`);
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) {
      throw new NativeDiagramValidationError('must start with a letter and contain only letters, digits, _ or -', `${path}[${index}].id`);
    }
    if (seen.has(id)) {
      throw new NativeDiagramValidationError(`duplicate id "${id}"`, `${path}[${index}].id`);
    }
    seen.add(id);
  }
  return seen;
}

export function validationReceipt(type, metrics) {
  return {
    ok: true,
    type,
    input: '<inline-diagram>',
    checks: [
      { name: 'schema', ok: true },
      { name: 'unique_ids', ok: true },
      { name: 'endpoint_validity', ok: true },
      { name: 'complexity_budget', ok: true },
      { name: 'accessible_svg', ok: true },
    ],
    composition: { issues: [], metrics },
  };
}

export function buildStandaloneHtml(model) {
  const title = escapeHtml(model.title);
  const subtitle = escapeHtml(model.subtitle ?? 'Evidence-grounded software engineering diagram');
  const description = escapeHtml(model.description);
  const diagramId = `diago-${escapeHtml(model.type)}`;
  const mobile = model.mobile ?? model;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark light">
  <title>${title} · Diago</title>
  <style>
    :root{--radius:18px}
    *{box-sizing:border-box}html{background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{margin:0;min-width:320px;background:var(--bg)}main{width:min(1280px,100%);margin:0 auto;padding:32px clamp(16px,4vw,56px) 48px}header{display:grid;gap:8px;margin-bottom:24px}.eyebrow{color:var(--mint);font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}h1{font-size:clamp(28px,5vw,52px);line-height:1.04;margin:0;max-width:18ch}header p{color:var(--muted);font-size:clamp(14px,2vw,18px);line-height:1.6;margin:0;max-width:72ch}.canvas{overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:color-mix(in srgb,var(--panel) 92%,transparent);box-shadow:none}.diagram-view{display:block;width:100%;height:auto}.diagram-mobile{display:none}.diagram-node{outline:none;cursor:default}.diagram-node rect{transition:stroke .16s ease,filter .16s ease}.diagram-node:hover rect,.diagram-node:focus-visible rect{stroke:var(--mint);filter:none}.node-title{fill:var(--text);font-size:17px;font-weight:750}.node-copy{fill:var(--muted);font-size:12px}.node-key{fill:var(--mint);font-size:10px;font-weight:800}.status-verified{--status:var(--mint)}.status-proposed{--status:var(--cyan)}.status-assumption{--status:var(--amber)}.status-completed{--status:var(--mint)}.status-current{--status:var(--cyan)}.status-risk{--status:var(--rose)}.relationship{fill:none;stroke:var(--line);stroke-width:2}.relationship.status-proposed{stroke:var(--cyan);stroke-dasharray:8 7}.relationship.status-assumption{stroke:var(--amber);stroke-dasharray:3 6}.relationship-label{fill:var(--text);font-size:11px;font-weight:700;paint-order:stroke;stroke:var(--bg);stroke-width:5px;stroke-linejoin:round}.legend{display:flex;flex-wrap:wrap;gap:14px;padding:14px 18px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}.legend span{display:inline-flex;align-items:center;gap:7px}.legend i{width:9px;height:9px;border-radius:50%;background:var(--status)}footer{color:var(--muted);font-size:12px;padding-top:16px}@media(max-width:760px){main{padding:20px 12px 32px}.canvas{border-radius:14px}.diagram-desktop{display:none}.diagram-mobile{display:block}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    .engineering-details{margin-top:24px}.engineering-details h2{font-size:20px}.engineering-table{overflow-x:auto;border:1px solid var(--line);border-radius:12px}.engineering-table table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}.engineering-table caption{padding:12px;color:var(--muted);text-align:left}.engineering-table th,.engineering-table td{padding:12px;vertical-align:top;border-top:1px solid var(--line);overflow-wrap:anywhere;min-width:110px}.engineering-table td{color:var(--muted)}
${presentationCss}
  </style>
  ${nativeThemeScript}
</head>
<body class="quality-${escapeHtml(model.quality ?? 'showcase')}">
  <main class="diago-native">
    <div class="diago-native-tools"><div class="diago-theme-group">${themeControl()}</div></div>
    <header><span class="eyebrow">Diago · ${escapeHtml(model.type)}</span><h1>${title}</h1><p>${subtitle}</p></header>
    <section class="canvas" aria-label="${title}">
      <svg class="diagram-view diagram-desktop" role="group" aria-labelledby="${diagramId}-title ${diagramId}-desc" viewBox="0 0 ${model.width} ${model.height}" tabindex="0">
        <title id="${diagramId}-title">${title}</title>
        <desc id="${diagramId}-desc">${description}</desc>
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.25" markerHeight="5.25" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--cyan)"/></marker></defs>
        ${model.svg}
      </svg>
      <svg class="diagram-view diagram-mobile" role="group" aria-labelledby="${diagramId}-mobile-title ${diagramId}-mobile-desc" viewBox="0 0 ${mobile.width} ${mobile.height}" tabindex="0">
        <title id="${diagramId}-mobile-title">${title}</title>
        <desc id="${diagramId}-mobile-desc">${description}</desc>
        <defs><marker id="arrow-mobile" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.25" markerHeight="5.25" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--cyan)"/></marker></defs>
        ${mobile.svg}
      </svg>
      <div class="legend" aria-label="Evidence status legend">${model.legend}</div>
    </section>
    ${model.details ?? ''}
    <footer>Standalone HTML · deterministic native renderer · source evidence remains authoritative</footer>
  </main>
${arrowAssets(model.type)}
${walkthroughAssets()}
</body>
</html>
`;
}

export function statusLegend(statuses) {
  return statuses
    .map((status) => `<span class="status-${escapeHtml(status)}"><i></i>${escapeHtml(status)}</span>`)
    .join('');
}
