import {
  buildStandaloneHtml,
  escapeHtml,
  NativeDiagramValidationError,
  requireArray,
  requireDocument,
  requireEnum,
  requireString,
  requireUniqueIds,
  statusLegend,
  svgTextLines,
  validationReceipt,
  wrapWords,
} from './shared.mjs';
import { mobileLayers } from './mobile/layers.mjs';

const STATUSES = ['verified', 'proposed', 'assumption'];

function requireLayerReference(id, layerIds, path, noun) {
  if (!layerIds.has(id)) throw new NativeDiagramValidationError(`unknown ${noun} "${id}"`, path);
}

export function validateLayers(diagram) {
  requireDocument(diagram, 'layers');
  const layers = requireArray(diagram.layers, 'layers', { min: 1, max: 7, label: 'layers', decomposition: true });
  const dependencies = requireArray(diagram.dependencies, 'dependencies', { max: 16, label: 'dependencies', decomposition: true });
  const concerns = requireArray(diagram.concerns, 'concerns', { max: 8, label: 'concerns', decomposition: true });
  const gaps = requireArray(diagram.gaps, 'gaps', { max: 8, label: 'gaps', decomposition: true });
  const layerIds = requireUniqueIds(layers, 'layers');
  requireUniqueIds(concerns, 'concerns');
  requireUniqueIds(gaps, 'gaps');
  const orders = new Set();
  let responsibilityCount = 0;

  layers.forEach((layer, index) => {
    const base = `layers[${index}]`;
    requireString(layer.label, `${base}.label`);
    requireEnum(layer.status, STATUSES, `${base}.status`);
    if (!Number.isInteger(layer.order) || layer.order < 1) {
      throw new NativeDiagramValidationError('order must be a positive integer', `${base}.order`);
    }
    if (orders.has(layer.order)) throw new NativeDiagramValidationError(`duplicate order "${layer.order}"`, `${base}.order`);
    orders.add(layer.order);
    const responsibilities = requireArray(layer.responsibilities, `${base}.responsibilities`, { min: 1 });
    responsibilityCount += responsibilities.length;
    responsibilities.forEach((item, itemIndex) => requireString(item, `${base}.responsibilities[${itemIndex}]`));
  });
  if (responsibilityCount > 24) {
    throw new NativeDiagramValidationError('supports at most 24 responsibilities. Use overview-detail decomposition.', 'layers');
  }

  dependencies.forEach((dependency, index) => {
    const base = `dependencies[${index}]`;
    requireString(dependency.label, `${base}.label`);
    requireEnum(dependency.status, STATUSES, `${base}.status`);
    for (const endpoint of ['from', 'to']) {
      const id = requireString(dependency[endpoint], `${base}.${endpoint}`);
      requireLayerReference(id, layerIds, `${base}.${endpoint}`, 'endpoint');
    }
  });

  concerns.forEach((concern, index) => {
    const base = `concerns[${index}]`;
    requireString(concern.label, `${base}.label`);
    requireString(concern.responsibility, `${base}.responsibility`);
    requireEnum(concern.status, STATUSES, `${base}.status`);
    requireArray(concern.appliesTo, `${base}.appliesTo`, { min: 1 }).forEach((id, targetIndex) => {
      requireLayerReference(requireString(id, `${base}.appliesTo[${targetIndex}]`), layerIds, `${base}.appliesTo[${targetIndex}]`, 'layer');
    });
  });

  gaps.forEach((gap, index) => {
    const base = `gaps[${index}]`;
    requireString(gap.label, `${base}.label`);
    requireEnum(gap.status, STATUSES, `${base}.status`);
    requireLayerReference(requireString(gap.layer, `${base}.layer`), layerIds, `${base}.layer`, 'layer');
  });

  return validationReceipt('layers', {
    layers: layers.length,
    responsibilities: responsibilityCount,
    dependencies: dependencies.length,
    concerns: concerns.length,
    gaps: gaps.length,
  });
}

function layerLayout(diagram) {
  const ordered = [...diagram.layers].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const rowHeight = 116;
  const layerX = 160;
  const layerWidth = 640;
  const top = 54;
  const positions = new Map(ordered.map((layer, index) => [layer.id, {
    x: layerX,
    y: top + (index * rowHeight),
    width: layerWidth,
    height: 88,
  }]));
  return {
    ordered,
    positions,
    width: diagram.concerns.length ? 1120 : 900,
    height: (top * 2) + (ordered.length * rowHeight),
  };
}

function dependencySvg(dependency, positions, index) {
  const from = positions.get(dependency.from);
  const to = positions.get(dependency.to);
  const corridorX = 96 - (index * 12);
  const fromY = from.y + (from.height / 2);
  const toY = to.y + (to.height / 2);
  return `<g aria-label="${escapeHtml(dependency.label)}">
    <path class="relationship status-${escapeHtml(dependency.status)}" d="M ${from.x} ${fromY} L ${corridorX} ${fromY} L ${corridorX} ${toY} L ${to.x} ${toY}" marker-end="url(#arrow)"/>
    <text class="relationship-label" x="${corridorX + 7}" y="${(fromY + toY) / 2}" transform="rotate(-90 ${corridorX + 7} ${(fromY + toY) / 2})" text-anchor="middle">${escapeHtml(dependency.label)}</text>
  </g>`;
}

function layerSvg(layer, box, gaps) {
  const responsibilities = layer.responsibilities.map((item, index) => {
    const x = box.x + 24 + ((index % 3) * 196);
    const y = box.y + 58 + (Math.floor(index / 3) * 19);
    return `<text class="node-copy" x="${x}" y="${y}">• ${escapeHtml(item)}</text>`;
  }).join('');
  const gapLabels = gaps.filter((gap) => gap.layer === layer.id).map((gap, index) => (
    `<text class="node-copy" x="${box.x + box.width - 20}" y="${box.y + 27 + (index * 18)}" text-anchor="end" fill="#f2c66d">⚠ ${escapeHtml(gap.label)}</text>`
  )).join('');
  return `<g class="diagram-node status-${escapeHtml(layer.status)}" tabindex="0" aria-label="${escapeHtml(layer.label)}, ${escapeHtml(layer.status)}">
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="15" fill="#0d1824" stroke="var(--status)" stroke-width="2"/>
    <circle cx="${box.x + 20}" cy="${box.y + 24}" r="5" fill="var(--status)"/>
    <text class="node-title" x="${box.x + 34}" y="${box.y + 30}">${escapeHtml(layer.order)} · ${escapeHtml(layer.label)}</text>
    ${gapLabels}${responsibilities}
  </g>`;
}

function concernSvg(concern, positions, index) {
  const targets = concern.appliesTo.map((id) => positions.get(id));
  const top = Math.min(...targets.map(({ y }) => y));
  const bottom = Math.max(...targets.map(({ y, height }) => y + height));
  const x = 842 + ((index % 2) * 132);
  const responsibility = svgTextLines(wrapWords(concern.responsibility, 18, 4), {
    x: x + 56,
    y: top + 71,
    lineHeight: 16,
    anchor: 'middle',
  });
  return `<g class="diagram-node status-${escapeHtml(concern.status)}" tabindex="0" aria-label="${escapeHtml(concern.label)}, cross-cutting control">
    <rect x="${x}" y="${top}" width="112" height="${bottom - top}" rx="14" fill="#0d1824" stroke="var(--status)" stroke-width="2" stroke-dasharray="8 6"/>
    <text class="node-title" x="${x + 56}" y="${top + 25}" text-anchor="middle" style="font-size:13px">${escapeHtml(concern.label)}</text>
    <text class="node-copy" x="${x + 56}" y="${top + 48}" text-anchor="middle">${escapeHtml(concern.status)}</text>
    ${responsibility}
  </g>`;
}

export function renderLayers(diagram, quality = 'showcase') {
  const layout = layerLayout(diagram);
  const mobile = mobileLayers(diagram);
  const dependencies = diagram.dependencies.map((dependency, index) => dependencySvg(dependency, layout.positions, index)).join('');
  const layers = layout.ordered.map((layer) => layerSvg(layer, layout.positions.get(layer.id), diagram.gaps)).join('');
  const concerns = diagram.concerns.map((concern, index) => concernSvg(concern, layout.positions, index)).join('');
  return buildStandaloneHtml({
    type: 'layers',
    title: diagram.meta.title,
    subtitle: diagram.meta.subtitle,
    description: `Layered architecture with ${diagram.layers.length} layers, ${diagram.concerns.length} cross-cutting controls, and ${diagram.gaps.length} explicit gaps.`,
    width: layout.width,
    height: layout.height,
    quality,
    svg: `${dependencies}${layers}${concerns}`,
    mobile,
    legend: statusLegend(STATUSES),
  });
}

export const layersRenderer = Object.freeze({
  validate: validateLayers,
  render: renderLayers,
});
