import { arrowAttrs, validateArrows } from '../arrows.mjs';
import { buildStandaloneHtml, escapeHtml as esc, NativeDiagramValidationError, requireArray, requireDocument, requireEnum, requireUniqueIds, statusLegend, validationReceipt } from './shared.mjs';
import { detailTable, documentFields, label, object, reference, text, uniquePair } from './engineering-shared.mjs';

const STATUSES = ['verified', 'proposed', 'assumption'];

// At this bounded size, reachability is simpler than a general layout dependency.
// Mutually reachable nodes share a rank; the condensed graph is always acyclic.
export function dependencyLayout(diagram) {
  const ids = diagram.nodes.map(n => n.id);
  const reach = new Map(ids.map(id => [id, new Set([id])]));
  for (const edge of diagram.edges) reach.get(edge.from).add(edge.to);
  for (const via of ids) for (const from of ids) if (reach.get(from).has(via)) {
    for (const to of reach.get(via)) reach.get(from).add(to);
  }
  const groups = [];
  const membership = new Map();
  for (const id of ids) if (!membership.has(id)) {
    const members = ids.filter(other => reach.get(id).has(other) && reach.get(other).has(id));
    members.forEach(member => membership.set(member, groups.length));
    groups.push(members);
  }
  const ranks = groups.map(() => 0);
  for (let pass = 0; pass < groups.length; pass++) for (const edge of diagram.edges) {
    const from = membership.get(edge.from), to = membership.get(edge.to);
    if (from !== to) ranks[to] = Math.max(ranks[to], ranks[from] + 1);
  }
  const rankCount = Math.max(...ranks) + 1;
  const columns = Array.from({ length: rankCount }, () => []);
  for (const node of diagram.nodes) columns[ranks[membership.get(node.id)]].push(node);
  const width = Math.max(760, rankCount * 320 + 30);
  const inset = (width - (rankCount * 320 + 30)) / 2;
  const positions = new Map();
  const hasLongEdge = diagram.edges.some(edge => ranks[membership.get(edge.to)] - ranks[membership.get(edge.from)] > 1);
  const top = hasLongEdge ? 70 + diagram.edges.length * 14 : 70;
  const rowCount = Math.max(...columns.map(c => c.length));
  columns.forEach((column, rank) => column.forEach((node, row) => positions.set(node.id, {
    x: 40 + inset + rank * 320, y: top + row * 136, rank,
  })));
  return { positions, rankCount, width, height: top + rowCount * 136 + 24,
    cyclic: edge => membership.get(edge.from) === membership.get(edge.to),
    cycles: groups.filter(group => group.length > 1).length };
}

export function validateDependency(diagram) {
  requireDocument(diagram, 'dependency');
  validateArrows('dependency', diagram);
  documentFields(diagram, ['nodes', 'edges']);
  const nodes = requireArray(diagram.nodes, 'nodes', { min: 1, max: 9, decomposition: true });
  const edges = requireArray(diagram.edges, 'edges', { max: 14, decomposition: true });
  const ids = requireUniqueIds(nodes, 'nodes');
  nodes.forEach((node, i) => {
    const p = `nodes[${i}]`;
    object(node, p, ['id', 'label', 'kind', 'status', 'evidence']);
    text(node.label, `${p}.label`, 48);
    requireEnum(node.kind, ['module', 'package', 'service', 'external'], `${p}.kind`);
    requireEnum(node.status, STATUSES, `${p}.status`);
    text(node.evidence, `${p}.evidence`, 300);
  });
  const pairs = new Set();
  edges.forEach((edge, i) => {
    const p = `edges[${i}]`;
    object(edge, p, ['from', 'to', 'label', 'status', 'evidence', 'arrow']);
    reference(edge.from, ids, `${p}.from`); reference(edge.to, ids, `${p}.to`);
    if (edge.from === edge.to) throw new NativeDiagramValidationError('self dependency is not supported; describe internal recursion separately', p);
    uniquePair(pairs, edge.from, edge.to, p);
    text(edge.label, `${p}.label`, 64);
    requireEnum(edge.status, STATUSES, `${p}.status`);
    text(edge.evidence, `${p}.evidence`, 300);
  });
  const layout = dependencyLayout(diagram);
  if (layout.rankCount > 4) throw new NativeDiagramValidationError('supports at most 4 dependency ranks. Use overview-detail decomposition.', 'edges');
  return validationReceipt('dependency', { nodes: nodes.length, edges: edges.length, ranks: layout.rankCount, cycles: layout.cycles });
}

function nodeSvg(node, x, y, fanIn) {
  return `<g data-node-id="${esc(node.id)}" data-node-label="${esc(node.label)}" role="button" tabindex="0" class="diagram-node status-${node.status}" aria-label="${esc(`${node.label}. ${node.kind}; ${node.status}; ${fanIn} direct dependents. ${node.evidence}`)}"><title>${esc(node.evidence)}</title><rect x="${x}" y="${y}" width="220" height="108" rx="12" fill="var(--panel)" stroke="var(--status)"/>
    <text class="node-key" x="${x + 14}" y="${y + 20}">${esc(node.kind)} · ${fanIn} dependents</text>${label(node.label, x + 14, y + 44, 24, 'node-title')}<text class="node-copy" x="${x + 14}" y="${y + 96}">${node.status}</text></g>`;
}

function edgeAttributes(edge, index, cyclic) {
  const description = `${index + 1}. ${edge.label}${cyclic ? ' · cycle' : ''} · ${edge.status}`;
  return `${arrowAttrs(edge, 'dependency')} data-edge-from="${esc(edge.from)}" data-edge-to="${esc(edge.to)}" data-edge-label="${esc(description)}" aria-label="${esc(`${description}. ${edge.evidence}`)}"`;
}

export function renderDependency(diagram, quality = 'showcase') {
  const layout = dependencyLayout(diagram);
  const fanIn = id => diagram.edges.filter(e => e.to === id).length;
  const edges = diagram.edges.map((edge, i) => {
    const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
    const cycle = layout.cyclic(edge);
    const x1 = from.x + 220, y1 = from.y + 34 + (i % 4) * 10;
    const y2 = to.y + 34 + (i % 4) * 10;
    let route, tx, ty;
    if (cycle) {
      const corridor = x1 + 24 + i * 3;
      route = `M ${x1} ${y1} H ${corridor} V ${y2} H ${to.x + 220}`;
      tx = corridor + 4; ty = (y1 + y2) / 2;
    } else if (to.rank === from.rank + 1) {
      const corridor = x1 + 24 + i * 3;
      route = `M ${x1} ${y1} H ${corridor} V ${y2} H ${to.x}`;
      tx = corridor + 4; ty = y1 - 6;
    } else {
      const outerY = 46 + i * 14;
      route = `M ${x1} ${y1} H ${x1 + 16} V ${outerY} H ${to.x - 16} V ${y2} H ${to.x}`;
      tx = (x1 + to.x) / 2; ty = outerY - 4;
    }
    return `<g ${edgeAttributes(edge, i, cycle)}><title>${esc(edge.evidence)}</title><path class="relationship status-${edge.status}" style="stroke:var(--${cycle ? 'rose' : edge.status === 'verified' ? 'cyan' : edge.status === 'proposed' ? 'cyan' : 'amber'})" d="${route}" marker-end="url(#arrow)"/><text class="relationship-label" x="${tx}" y="${ty}">${i + 1}${cycle ? ' ↺' : ''}</text></g>`;
  }).join('');
  const nodes = diagram.nodes.map(node => { const p = layout.positions.get(node.id); return nodeSvg(node, p.x, p.y, fanIn(node.id)); }).join('');
  let y = 28;
  const mobile = diagram.nodes.map(node => {
    let svg = nodeSvg(node, 24, y, fanIn(node.id)); y += 128;
    diagram.edges.forEach((edge, i) => {
      if (edge.from !== node.id) return;
      const target = diagram.nodes.find(n => n.id === edge.to);
      svg += `<g ${edgeAttributes(edge, i, layout.cyclic(edge))}>${label(`${i + 1}. Depends on ${target.label}${layout.cyclic(edge) ? ' (cycle)' : ''}`, 36, y, 30)}</g>`;
      y += 65;
    });
    y += 16; return svg;
  }).join('');
  const names = Object.fromEntries(diagram.nodes.map(n => [n.id, n.label]));
  return buildStandaloneHtml({ type: 'dependency', title: diagram.meta.title, subtitle: diagram.meta.subtitle,
    description: 'Arrows point from a dependent to its dependency. Counts are direct incoming dependencies, not runtime traffic. Cycle labels identify structural cycles in the authored graph, including unverified edges.',
    ...layout, svg: `<text class="node-copy" x="40" y="25">Dependent → dependency · numbered connections below</text>${edges}${nodes}`, quality,
    mobile: { width: 320, height: y, svg: mobile },
    legend: statusLegend(STATUSES) + '<span class="status-risk"><i></i>↺ Structural cycle (check edge evidence)</span>',
    details: detailTable('Modules and packages', ['Node', 'Kind / status', 'Evidence'], diagram.nodes.map(n => [n.label, `${n.kind} / ${n.status}`, n.evidence])) +
      detailTable('Dependency register', ['Connection', 'Relationship', 'Status', 'Evidence'], diagram.edges.map((e, i) => [`${i + 1}. ${names[e.from]} → ${names[e.to]}`, e.label, `${e.status}${layout.cyclic(e) ? ' / structural cycle' : ''}`, e.evidence])),
  });
}

export const dependencyRenderer = Object.freeze({ validate: validateDependency, render: renderDependency });
