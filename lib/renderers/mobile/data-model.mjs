import { escapeHtml } from '../shared.mjs';

function entityCard(entity, box) {
  const fields = entity.fields.map((field, index) => {
    const y = box.y + 82 + (index * 25);
    const key = field.key ? field.key.slice(0, 2).toUpperCase() : '';
    const required = field.required === false ? '?' : '';
    return `<text class="node-key" x="${box.x + 18}" y="${y}">${escapeHtml(key)}</text>
      <text class="node-copy" x="${box.x + 52}" y="${y}">${escapeHtml(field.name)}${required}</text>
      <text class="node-copy" x="${box.x + box.width - 18}" y="${y}" text-anchor="end">${escapeHtml(field.type)}</text>`;
  }).join('');
  const constraints = (entity.constraints ?? []).map((constraint, index) => {
    const y = box.y + 96 + (entity.fields.length * 25) + (index * 18);
    return `<text class="node-copy" x="${box.x + 18}" y="${y}">• ${escapeHtml(constraint)}</text>`;
  }).join('');
  return `<g class="diagram-node status-${escapeHtml(entity.status)}" tabindex="0" aria-label="${escapeHtml(entity.label)}, ${escapeHtml(entity.status)}">
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="16" fill="#0d1824" stroke="var(--status)" stroke-width="2"/>
    <circle cx="${box.x + 20}" cy="${box.y + 24}" r="5" fill="var(--status)"/>
    <text class="node-title" x="${box.x + 34}" y="${box.y + 30}">${escapeHtml(entity.label)}</text>
    <text class="node-copy" x="${box.x + 18}" y="${box.y + 55}">${escapeHtml(entity.status)}</text>
    <line x1="${box.x + 18}" y1="${box.y + 66}" x2="${box.x + box.width - 18}" y2="${box.y + 66}" stroke="#274156"/>
    ${fields}${constraints}
  </g>`;
}

export function mobileDataModel(diagram) {
  const width = 348;
  const cardWidth = 300;
  const margin = 24;
  const gap = 24;
  const positions = new Map();
  let y = margin;

  for (const entity of diagram.entities) {
    const height = 102 + (entity.fields.length * 25) + ((entity.constraints?.length ?? 0) * 18);
    positions.set(entity.id, { x: margin, y, width: cardWidth, height });
    y += height + gap;
  }

  const labels = new Map(diagram.entities.map(({ id, label }) => [id, label]));
  const entities = diagram.entities.map((entity) => entityCard(entity, positions.get(entity.id))).join('');
  const headingY = y + 12;
  const relationships = diagram.relationships.map((relationship, index) => {
    const rowY = headingY + 22 + (index * 70);
    return `<g class="status-${escapeHtml(relationship.status)}" aria-label="${escapeHtml(relationship.label)}">
      <rect x="${margin}" y="${rowY}" width="${cardWidth}" height="58" rx="12" fill="#0d1824" stroke="var(--status)"/>
      <circle cx="${margin + 16}" cy="${rowY + 17}" r="4" fill="var(--status)"/>
      <text class="node-key" x="${margin + 28}" y="${rowY + 21}">${escapeHtml(relationship.label)} · ${escapeHtml(relationship.fromCardinality)} → ${escapeHtml(relationship.toCardinality)}</text>
      <text class="node-title" x="${margin + 16}" y="${rowY + 43}" style="font-size:13px">${escapeHtml(labels.get(relationship.from))} → ${escapeHtml(labels.get(relationship.to))}</text>
    </g>`;
  }).join('');

  return {
    width,
    height: diagram.relationships.length ? headingY + 34 + (diagram.relationships.length * 70) : y,
    svg: `${entities}<text class="node-title" x="${margin}" y="${headingY}" style="font-size:14px">Relationships</text>${relationships}`,
  };
}
