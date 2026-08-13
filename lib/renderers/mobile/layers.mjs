import { escapeHtml, svgTextLines, wrapWords } from '../shared.mjs';

function informationCard({ x, y, width, title, meta, lines, status }) {
  const height = 58 + (lines.length * 17);
  return {
    height,
    svg: `<g class="diagram-node status-${escapeHtml(status)}" tabindex="0" aria-label="${escapeHtml(title)}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="13" fill="#0d1824" stroke="var(--status)"/>
      <circle cx="${x + 16}" cy="${y + 19}" r="4" fill="var(--status)"/>
      <text class="node-title" x="${x + 28}" y="${y + 24}" style="font-size:14px">${escapeHtml(title)}</text>
      <text class="node-key" x="${x + 16}" y="${y + 43}">${escapeHtml(meta)}</text>
      ${svgTextLines(lines, { x: x + 16, y: y + 63, lineHeight: 17 })}
    </g>`,
  };
}

export function mobileLayers(diagram) {
  const ordered = [...diagram.layers].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const labels = new Map(ordered.map(({ id, label }) => [id, label]));
  const width = 348;
  const x = 18;
  const cardWidth = 312;
  const gap = 18;
  let y = 24;
  let svg = '';

  for (const layer of ordered) {
    const gapLines = diagram.gaps
      .filter((gapItem) => gapItem.layer === layer.id)
      .map((gapItem) => `Gap: ${gapItem.label}`);
    const lines = [...layer.responsibilities.map((item) => `• ${item}`), ...gapLines];
    const card = informationCard({
      x,
      y,
      width: cardWidth,
      title: `${layer.order} · ${layer.label}`,
      meta: layer.status,
      lines,
      status: layer.status,
    });
    svg += card.svg;
    y += card.height + gap;
  }

  svg += `<text class="node-title" x="${x}" y="${y + 8}" style="font-size:14px">Allowed dependencies</text>`;
  y += 24;
  for (const dependency of diagram.dependencies) {
    const card = informationCard({
      x,
      y,
      width: cardWidth,
      title: dependency.label,
      meta: `${labels.get(dependency.from)} → ${labels.get(dependency.to)}`,
      lines: [],
      status: dependency.status,
    });
    svg += card.svg;
    y += card.height + gap;
  }

  svg += `<text class="node-title" x="${x}" y="${y + 8}" style="font-size:14px">Cross-cutting controls</text>`;
  y += 24;
  for (const concern of diagram.concerns) {
    const appliesTo = concern.appliesTo.map((id) => labels.get(id)).join(' → ');
    const card = informationCard({
      x,
      y,
      width: cardWidth,
      title: concern.label,
      meta: appliesTo,
      lines: wrapWords(concern.responsibility, 40, 3),
      status: concern.status,
    });
    svg += card.svg;
    y += card.height + gap;
  }

  return { width, height: y + 6, svg };
}
