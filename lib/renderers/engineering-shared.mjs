import { escapeHtml, NativeDiagramValidationError, requireString } from './shared.mjs';

// Bounded inputs keep deterministic SVG layout legible without dropping source text.
export function text(value, path, max = 80) {
  requireString(value, path);
  if ([...value].length > max) throw new NativeDiagramValidationError(`supports at most ${max} characters`, path);
  return value;
}

export function object(value, path, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new NativeDiagramValidationError('must be an object', path);
  for (const key of Object.keys(value)) if (!fields.includes(key)) throw new NativeDiagramValidationError(`unknown property "${key}"`, path);
}

export function documentFields(diagram, fields) {
  object(diagram, 'diagram', ['schema_version', 'diagram_type', 'meta', ...fields]);
  object(diagram.meta, 'meta', ['title', 'subtitle']);
  text(diagram.meta.title, 'meta.title', 120);
  if (diagram.meta.subtitle !== undefined) text(diagram.meta.subtitle, 'meta.subtitle', 240);
}

export function reference(id, ids, path) {
  if (!ids.has(id)) throw new NativeDiagramValidationError(`unknown reference "${id}"`, path);
}

export function uniquePair(seen, from, to, path) {
  const key = `${from}:${to}`;
  if (seen.has(key)) throw new NativeDiagramValidationError('duplicate pair', path);
  seen.add(key);
}

// Hard-wrap long identifiers as well as prose. Never truncate displayed evidence.
export function lines(value, limit = 24) {
  const result = [];
  let line = '';
  for (const word of value.trim().split(/\s+/)) {
    const chunks = [...word];
    if (line && [...line, ' ', ...chunks].length <= limit) { line += ` ${word}`; continue; }
    if (line) result.push(line);
    line = '';
    while (chunks.length > limit) result.push(chunks.splice(0, limit).join(''));
    line = chunks.join('');
  }
  if (line) result.push(line);
  return result;
}

export function label(value, x, y, limit = 24, className = 'node-copy', anchor = 'start') {
  // Bound the physical advance as well as the character count: wide identifiers
  // (e.g. WWW...) must not escape a cell or cover a neighboring node.
  const advance = className === 'node-title' ? 8 : 6.7;
  return lines(value, limit).map((line, i) => `<text class="${className}" x="${x}" y="${y + i * 17}" text-anchor="${anchor}" textLength="${([...line].length * advance).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${escapeHtml(line)}</text>`).join('');
}

export function detailTable(caption, headings, rows) {
  return `<section class="engineering-details"><h2>${escapeHtml(caption)}</h2><div class="engineering-table" tabindex="0" role="region" aria-label="${escapeHtml(caption)}"><table><caption>${escapeHtml(caption)} — complete authored values</caption><thead><tr>${headings.map(h => `<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => i ? `<td>${escapeHtml(cell)}</td>` : `<th scope="row">${escapeHtml(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
