import { buildStandaloneHtml, escapeHtml as esc, requireArray, requireDocument, requireEnum, requireUniqueIds, validationReceipt } from './shared.mjs';
import { detailTable, documentFields, label, lines, object, text } from './engineering-shared.mjs';

const STATUSES = ['hypothesis', 'confirmed', 'ruled-out'];
const COLORS = { hypothesis: 'amber', confirmed: 'mint', 'ruled-out': 'muted' };

export function validateFishbone(diagram) {
  requireDocument(diagram, 'fishbone');
  documentFields(diagram, ['effect', 'categories']);
  object(diagram.effect, 'effect', ['label', 'evidence']);
  text(diagram.effect.label, 'effect.label', 72);
  text(diagram.effect.evidence, 'effect.evidence', 300);
  const categories = requireArray(diagram.categories, 'categories', { min: 1, max: 6, decomposition: true });
  requireUniqueIds(categories, 'categories');
  const allCauses = [];
  categories.forEach((category, i) => {
    const p = `categories[${i}]`;
    object(category, p, ['id', 'label', 'causes']);
    text(category.label, `${p}.label`, 32);
    requireArray(category.causes, `${p}.causes`, { min: 1, max: 3, decomposition: true }).forEach((cause, j) => {
      const c = `${p}.causes[${j}]`;
      object(cause, c, ['id', 'label', 'status', 'evidence']);
      text(cause.label, `${c}.label`, 56);
      requireEnum(cause.status, STATUSES, `${c}.status`);
      text(cause.evidence, `${c}.evidence`, 300);
      allCauses.push(cause);
    });
  });
  requireUniqueIds(allCauses, 'causes');
  return validationReceipt('fishbone', { categories: categories.length, causes: allCauses.length,
    confirmed: allCauses.filter(c => c.status === 'confirmed').length });
}

export function renderFishbone(diagram, quality = 'showcase') {
  // One pair per column. Width grows with category count; no clipped sixth bone.
  const pairs = Math.ceil(diagram.categories.length / 2), head = pairs * 320 + 80, center = 390;
  let svg = `<text class="node-copy" x="24" y="28">Investigation map · branches group candidates; they do not prove causation</text><path data-arrow-type="effect" class="relationship" style="stroke:var(--cyan)" d="M 30 ${center} H ${head}" marker-end="url(#arrow)"/>`;
  diagram.categories.forEach((category, i) => {
    const above = i % 2 === 0, x = 30 + Math.floor(i / 2) * 320, endY = above ? 65 : 715;
    const attach = x + 285, far = x + 95;
    svg += `<g role="group" aria-label="${esc(category.label)}"><path class="relationship" d="M ${far} ${endY} L ${attach} ${center}"/>`;
    svg += label(category.label, x + 20, above ? 58 : 744, 32, 'node-title');
    category.causes.forEach((cause, j) => {
      const fraction = (j + 1) / 4, tickX = far + (attach - far) * fraction;
      const tickY = endY + (center - endY) * fraction;
      const labelY = above ? tickY - 60 : tickY + 18;
      svg += `<g role="img" aria-label="${esc(`${cause.label}; ${cause.status}. ${cause.evidence}`)}"><title>${esc(cause.evidence)}</title><path class="relationship" style="stroke:var(--${COLORS[cause.status]})" ${cause.status === 'hypothesis' ? 'stroke-dasharray="3 4"' : ''} d="M ${x + 12} ${tickY} H ${tickX}"/>${label(cause.label, x + 12, labelY, 29)}<text class="node-key" style="fill:var(--${COLORS[cause.status]})" x="${x + 12}" y="${labelY + lines(cause.label, 29).length * 17}">${cause.status}</text></g>`;
    });
    svg += '</g>';
  });
  svg += `<g role="img" aria-label="${esc(`Observed effect: ${diagram.effect.label}. ${diagram.effect.evidence}`)}"><rect x="${head}" y="${center - 78}" width="230" height="156" rx="12" fill="var(--panel)" stroke="var(--primary)"/><text class="node-key" x="${head + 16}" y="${center - 50}">OBSERVED EFFECT</text>${label(diagram.effect.label, head + 16, center - 24, 25)}</g>`;
  let y = 30;
  let mobileSvg = `<text class="node-key" x="20" y="${y}">OBSERVED EFFECT</text>${label(diagram.effect.label, 20, y + 26, 30)}`;
  y += 125;
  for (const category of diagram.categories) {
    mobileSvg += label(category.label, 20, y, 28, 'node-title'); y += 54;
    for (const cause of category.causes) {
      mobileSvg += `<g role="img" aria-label="${esc(`${cause.label}; ${cause.status}. ${cause.evidence}`)}"><rect x="16" y="${y - 20}" width="288" height="100" rx="8" fill="var(--${COLORS[cause.status]})" fill-opacity=".07"/>${label(cause.label, 28, y, 29)}<text class="node-key" style="fill:var(--${COLORS[cause.status]})" x="28" y="${y + 64}">${cause.status}</text></g>`;
      y += 114;
    }
    y += 20;
  }
  return buildStandaloneHtml({ type: 'fishbone', title: diagram.meta.title, subtitle: diagram.meta.subtitle, quality,
    description: `Observed effect: ${diagram.effect.label}. Categories group investigation findings; hypotheses and ruled-out candidates are not confirmed causes. Multiple contributing causes are allowed.`,
    width: head + 258, height: 794, svg, mobile: { width: 320, height: y, svg: mobileSvg },
    legend: STATUSES.map(status => `<span><i style="background:var(--${COLORS[status]})"></i>${status}</span>`).join(''),
    details: detailTable('Investigation evidence', ['Category', 'Finding', 'Status', 'Evidence'], [
      ['Observed effect', diagram.effect.label, 'observed', diagram.effect.evidence],
      ...diagram.categories.flatMap(category => category.causes.map(c => [category.label, c.label, c.status, c.evidence])),
    ]),
  });
}

export const fishboneRenderer = Object.freeze({ validate: validateFishbone, render: renderFishbone });
