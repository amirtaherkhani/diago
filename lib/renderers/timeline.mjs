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
  validationReceipt,
} from './shared.mjs';

const STATUSES = ['completed', 'current', 'proposed', 'risk'];

export function validateTimeline(diagram) {
  requireDocument(diagram, 'timeline');
  const tracks = requireArray(diagram.tracks, 'tracks', { min: 1, max: 4, label: 'tracks', decomposition: true });
  const milestones = requireArray(diagram.milestones, 'milestones', { min: 1, max: 12, label: 'milestones', decomposition: true });
  const dependencies = requireArray(diagram.dependencies, 'dependencies', { max: 16, label: 'dependencies', decomposition: true });
  const trackIds = requireUniqueIds(tracks, 'tracks');
  const milestoneIds = requireUniqueIds(milestones, 'milestones');

  tracks.forEach((track, index) => requireString(track.label, `tracks[${index}].label`));
  milestones.forEach((milestone, index) => {
    const base = `milestones[${index}]`;
    requireString(milestone.label, `${base}.label`);
    requireEnum(milestone.status, STATUSES, `${base}.status`);
    const track = requireString(milestone.track, `${base}.track`);
    if (!trackIds.has(track)) throw new NativeDiagramValidationError(`unknown track "${track}"`, `${base}.track`);
    if (!Number.isInteger(milestone.position) || milestone.position < 1) {
      throw new NativeDiagramValidationError('position must be a positive integer', `${base}.position`);
    }
    const hasDate = typeof milestone.date === 'string' && milestone.date.trim();
    const hasPhase = typeof milestone.phase === 'string' && milestone.phase.trim();
    if (!hasDate && !hasPhase) {
      throw new NativeDiagramValidationError('milestone must include an observed date or phase', base);
    }
  });

  dependencies.forEach((dependency, index) => {
    const base = `dependencies[${index}]`;
    requireString(dependency.label, `${base}.label`);
    requireEnum(dependency.status, STATUSES, `${base}.status`);
    for (const endpoint of ['from', 'to']) {
      const id = requireString(dependency[endpoint], `${base}.${endpoint}`);
      if (!milestoneIds.has(id)) {
        throw new NativeDiagramValidationError(`unknown endpoint "${id}"`, `${base}.${endpoint}`);
      }
    }
  });

  return validationReceipt('timeline', {
    tracks: tracks.length,
    milestones: milestones.length,
    dependencies: dependencies.length,
  });
}

function timelineLayout(diagram) {
  const ordered = [...diagram.milestones].sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));
  const marginX = 190;
  const stepX = 190;
  const top = 64;
  const laneHeight = 142;
  const positionIndex = new Map([...new Set(ordered.map(({ position }) => position))].map((position, index) => [position, index]));
  const trackIndex = new Map(diagram.tracks.map(({ id }, index) => [id, index]));
  const points = new Map(ordered.map((milestone) => [milestone.id, {
    x: marginX + (positionIndex.get(milestone.position) * stepX),
    y: top + 62 + (trackIndex.get(milestone.track) * laneHeight),
  }]));
  return {
    ordered,
    points,
    width: Math.max(820, (marginX * 2) + ((positionIndex.size - 1) * stepX)),
    height: (top * 2) + (diagram.tracks.length * laneHeight),
    top,
    laneHeight,
  };
}

function dependencySvg(dependency, points) {
  const from = points.get(dependency.from);
  const to = points.get(dependency.to);
  const middleY = Math.min(from.y, to.y) - 40;
  return `<g aria-label="${escapeHtml(dependency.label)}">
    <path class="relationship status-${escapeHtml(dependency.status)}" d="M ${from.x + 13} ${from.y} L ${from.x + 48} ${from.y} L ${from.x + 48} ${middleY} L ${to.x - 48} ${middleY} L ${to.x - 48} ${to.y} L ${to.x - 13} ${to.y}" marker-end="url(#arrow)"/>
    <text class="relationship-label" x="${(from.x + to.x) / 2}" y="${middleY - 8}" text-anchor="middle">${escapeHtml(dependency.label)}</text>
  </g>`;
}

function milestoneSvg(milestone, point) {
  const temporal = milestone.date ?? milestone.phase;
  return `<g class="diagram-node status-${escapeHtml(milestone.status)}" tabindex="0" aria-label="${escapeHtml(milestone.label)}, ${escapeHtml(temporal)}, ${escapeHtml(milestone.status)}">
    <circle cx="${point.x}" cy="${point.y}" r="13" fill="#0d1824" stroke="var(--status)" stroke-width="4"/>
    <line x1="${point.x}" y1="${point.y + 14}" x2="${point.x}" y2="${point.y + 34}" stroke="var(--status)" stroke-width="2"/>
    <rect x="${point.x - 74}" y="${point.y + 34}" width="148" height="70" rx="13" fill="#0d1824" stroke="#274156"/>
    <text class="node-key" x="${point.x}" y="${point.y + 54}" text-anchor="middle">${escapeHtml(temporal)}</text>
    <text class="node-title" x="${point.x}" y="${point.y + 76}" text-anchor="middle" style="font-size:13px">${escapeHtml(milestone.label)}</text>
    <text class="node-copy" x="${point.x}" y="${point.y + 95}" text-anchor="middle">${escapeHtml(milestone.status)}</text>
  </g>`;
}

export function renderTimeline(diagram, quality = 'showcase') {
  const layout = timelineLayout(diagram);
  const tracks = diagram.tracks.map((track, index) => {
    const y = layout.top + 62 + (index * layout.laneHeight);
    return `<g><text class="node-title" x="24" y="${y + 5}" style="font-size:14px">${escapeHtml(track.label)}</text><line x1="128" y1="${y}" x2="${layout.width - 42}" y2="${y}" stroke="#274156" stroke-width="2"/></g>`;
  }).join('');
  const dependencies = diagram.dependencies.map((dependency) => dependencySvg(dependency, layout.points)).join('');
  const milestones = layout.ordered.map((milestone) => milestoneSvg(milestone, layout.points.get(milestone.id))).join('');
  return buildStandaloneHtml({
    type: 'timeline',
    title: diagram.meta.title,
    subtitle: diagram.meta.subtitle,
    description: `Engineering timeline with ${diagram.tracks.length} tracks and ${diagram.milestones.length} milestones.`,
    width: layout.width,
    height: layout.height,
    quality,
    svg: `${tracks}${dependencies}${milestones}`,
    legend: statusLegend(STATUSES),
  });
}

export const timelineRenderer = Object.freeze({
  validate: validateTimeline,
  render: renderTimeline,
});
