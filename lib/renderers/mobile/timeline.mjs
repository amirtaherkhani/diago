import { escapeHtml, svgTextLines, wrapWords } from '../shared.mjs';

export function mobileTimeline(diagram) {
  const ordered = [...diagram.milestones]
    .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));
  const width = 348;
  const lineX = 24;
  const cardX = 48;
  const cardWidth = 276;
  const rowHeight = 116;
  const top = 44;
  const points = new Map(ordered.map((milestone, index) => [milestone.id, top + (index * rowHeight)]));
  const trackLabels = new Map(diagram.tracks.map(({ id, label }) => [id, label]));
  const cards = ordered.map((milestone) => {
    const y = points.get(milestone.id);
    const temporal = milestone.date ?? milestone.phase;
    const label = wrapWords(milestone.label, 30, 2);
    return `<g class="diagram-node status-${escapeHtml(milestone.status)}" tabindex="0" aria-label="${escapeHtml(milestone.label)}, ${escapeHtml(temporal)}, ${escapeHtml(milestone.status)}">
      <circle cx="${lineX}" cy="${y}" r="10" fill="#0d1824" stroke="var(--status)" stroke-width="3"/>
      <rect x="${cardX}" y="${y - 34}" width="${cardWidth}" height="84" rx="13" fill="#0d1824" stroke="#274156"/>
      <text class="node-key" x="${cardX + 16}" y="${y - 13}">${escapeHtml(temporal)} · ${escapeHtml(trackLabels.get(milestone.track))}</text>
      ${svgTextLines(label, { x: cardX + 16, y: y + 10, lineHeight: 17, className: 'node-title' })}
      <text class="node-copy" x="${cardX + cardWidth - 16}" y="${y + 35}" text-anchor="end">${escapeHtml(milestone.status)}</text>
    </g>`;
  }).join('');

  const dependencyTop = top + (ordered.length * rowHeight) + 8;
  const milestoneLabels = new Map(ordered.map((milestone) => [milestone.id, milestone.phase ?? milestone.date]));
  const dependencies = diagram.dependencies.map((dependency, index) => {
    const y = dependencyTop + 24 + (index * 62);
    return `<g class="status-${escapeHtml(dependency.status)}" aria-label="${escapeHtml(dependency.label)}">
      <rect x="${cardX}" y="${y}" width="${cardWidth}" height="50" rx="11" fill="#0d1824" stroke="var(--status)"/>
      <text class="node-key" x="${cardX + 14}" y="${y + 19}">${escapeHtml(dependency.label)}</text>
      <text class="node-copy" x="${cardX + 14}" y="${y + 39}">${escapeHtml(milestoneLabels.get(dependency.from))} → ${escapeHtml(milestoneLabels.get(dependency.to))}</text>
    </g>`;
  }).join('');

  return {
    width,
    height: dependencyTop + 40 + (diagram.dependencies.length * 62),
    svg: `<line x1="${lineX}" y1="${top}" x2="${lineX}" y2="${top + ((ordered.length - 1) * rowHeight)}" stroke="#274156" stroke-width="2"/>${cards}<text class="node-title" x="${cardX}" y="${dependencyTop}" style="font-size:14px">Dependencies</text>${dependencies}`,
  };
}
