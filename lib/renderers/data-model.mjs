import {
  buildStandaloneHtml,
  escapeHtml,
  requireArray,
  requireDocument,
  requireEnum,
  requireString,
  requireUniqueIds,
  statusLegend,
  validationReceipt,
  NativeDiagramValidationError,
} from './shared.mjs';

const STATUSES = ['verified', 'proposed', 'assumption'];
const KEYS = ['primary', 'foreign', 'unique'];
const CARDINALITIES = ['1', '0..1', '*', '0..*', '1..*'];

function validateFields(entity, entityIndex) {
  const fields = requireArray(entity.fields, `entities[${entityIndex}].fields`, { min: 1 });
  const names = new Set();
  fields.forEach((field, fieldIndex) => {
    const base = `entities[${entityIndex}].fields[${fieldIndex}]`;
    const name = requireString(field?.name, `${base}.name`);
    requireString(field?.type, `${base}.type`);
    if (names.has(name)) throw new NativeDiagramValidationError(`duplicate field "${name}"`, `${base}.name`);
    names.add(name);
    if (field.key !== undefined) requireEnum(field.key, KEYS, `${base}.key`);
    if (field.required !== undefined && typeof field.required !== 'boolean') {
      throw new NativeDiagramValidationError('must be a boolean', `${base}.required`);
    }
  });
}

export function validateDataModel(diagram) {
  requireDocument(diagram, 'data-model');
  const entities = requireArray(diagram.entities, 'entities', {
    min: 1,
    max: 8,
    label: 'entities',
    decomposition: true,
  });
  const relationships = requireArray(diagram.relationships, 'relationships', {
    max: 12,
    label: 'relationships',
    decomposition: true,
  });
  const entityIds = requireUniqueIds(entities, 'entities');
  requireUniqueIds(relationships, 'relationships');

  entities.forEach((entity, index) => {
    requireString(entity.label, `entities[${index}].label`);
    requireEnum(entity.status, STATUSES, `entities[${index}].status`);
    validateFields(entity, index);
    if (entity.constraints !== undefined) {
      requireArray(entity.constraints, `entities[${index}].constraints`)
        .forEach((constraint, constraintIndex) => requireString(constraint, `entities[${index}].constraints[${constraintIndex}]`));
    }
  });

  relationships.forEach((relationship, index) => {
    const base = `relationships[${index}]`;
    requireString(relationship.label, `${base}.label`);
    requireEnum(relationship.status, STATUSES, `${base}.status`);
    requireEnum(relationship.fromCardinality, CARDINALITIES, `${base}.fromCardinality`);
    requireEnum(relationship.toCardinality, CARDINALITIES, `${base}.toCardinality`);
    for (const endpoint of ['from', 'to']) {
      const id = requireString(relationship[endpoint], `${base}.${endpoint}`);
      if (!entityIds.has(id)) {
        throw new NativeDiagramValidationError(`unknown endpoint "${id}"`, `${base}.${endpoint}`);
      }
    }
  });

  return validationReceipt('data-model', {
    entities: entities.length,
    relationships: relationships.length,
  });
}

function layoutEntities(entities) {
  const columns = Math.min(3, entities.length);
  const cardWidth = 300;
  const maxFieldCount = Math.max(...entities.map((entity) => entity.fields.length));
  const maxConstraintCount = Math.max(...entities.map((entity) => entity.constraints?.length ?? 0));
  const cardHeight = 102 + (maxFieldCount * 25) + (maxConstraintCount * 18);
  const gapX = 54;
  const gapY = 70;
  const margin = 64;
  const positions = new Map();
  entities.forEach((entity, index) => {
    positions.set(entity.id, {
      x: margin + ((index % columns) * (cardWidth + gapX)),
      y: margin + (Math.floor(index / columns) * (cardHeight + gapY)),
      width: cardWidth,
      height: cardHeight,
    });
  });
  return {
    positions,
    width: (margin * 2) + (columns * cardWidth) + ((columns - 1) * gapX),
    height: (margin * 2) + (Math.ceil(entities.length / columns) * cardHeight) + ((Math.ceil(entities.length / columns) - 1) * gapY),
  };
}

function relationshipSvg(relationship, positions) {
  const from = positions.get(relationship.from);
  const to = positions.get(relationship.to);
  const forward = from.x <= to.x;
  const startX = forward ? from.x + from.width : from.x;
  const endX = forward ? to.x : to.x + to.width;
  const startY = from.y + (from.height / 2);
  const endY = to.y + (to.height / 2);
  const bend = Math.max(44, Math.abs(endX - startX) / 2);
  const controlA = forward ? startX + bend : startX - bend;
  const controlB = forward ? endX - bend : endX + bend;
  const labelX = (startX + endX) / 2;
  const labelY = ((startY + endY) / 2) - 9;
  return `<g aria-label="${escapeHtml(relationship.label)}">
    <path class="relationship status-${escapeHtml(relationship.status)}" d="M ${startX} ${startY} C ${controlA} ${startY}, ${controlB} ${endY}, ${endX} ${endY}" marker-end="url(#arrow)"/>
    <text class="relationship-label" x="${startX + (forward ? 10 : -10)}" y="${startY - 9}" text-anchor="${forward ? 'start' : 'end'}">${escapeHtml(relationship.fromCardinality)}</text>
    <text class="relationship-label" x="${endX + (forward ? -10 : 10)}" y="${endY - 9}" text-anchor="${forward ? 'end' : 'start'}">${escapeHtml(relationship.toCardinality)}</text>
    <text class="relationship-label" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeHtml(relationship.label)}</text>
  </g>`;
}

function entitySvg(entity, box) {
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

export function renderDataModel(diagram, quality = 'showcase') {
  const layout = layoutEntities(diagram.entities);
  const relationships = diagram.relationships
    .map((relationship) => relationshipSvg(relationship, layout.positions))
    .join('');
  const entities = diagram.entities
    .map((entity) => entitySvg(entity, layout.positions.get(entity.id)))
    .join('');
  return buildStandaloneHtml({
    type: 'data-model',
    title: diagram.meta.title,
    subtitle: diagram.meta.subtitle,
    description: `Data model with ${diagram.entities.length} entities and ${diagram.relationships.length} explicit relationships.`,
    width: layout.width,
    height: layout.height,
    quality,
    svg: `${relationships}${entities}`,
    legend: statusLegend(STATUSES),
  });
}

export const dataModelRenderer = Object.freeze({
  validate: validateDataModel,
  render: renderDataModel,
});
