(() => {
  'use strict';
  const doc = JSON.parse(document.getElementById('explorer-data').textContent);
  const components = new Map(doc.components.map(c => [c.id, c]));
  const evidence = new Map(doc.evidence.map(e => [e.id, e]));
  const views = new Map(doc.views.map(v => [v.id, v]));
  const $ = id => document.getElementById(id);
  const el = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  const svg = (tag, attrs, text) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value); if (text !== undefined) n.textContent = text; return n; };
  const button = (text, action, className) => { const b = el('button', text, className); b.type = 'button'; b.addEventListener('click', action); return b; };
  let current = doc.root, trail = [doc.root], selected = null, scale = 1;
  const narrow = matchMedia('(max-width:640px)');
  document.querySelector('h1').textContent = doc.title;
  $('summary').textContent = doc.summary ?? '';
  const statusColor = status => `var(--${status})`;
  const measurement = document.createElement('canvas').getContext('2d');
  const fitText = (value, width, font) => {
    measurement.font = font;
    if (measurement.measureText(value).width <= width) return value;
    const letters = Array.from(value);
    while (letters.length && measurement.measureText(`${letters.join('')}…`).width > width) letters.pop();
    return `${letters.join('')}…`;
  };
  function activate(node, action) {
    node.addEventListener('click', action);
    node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); } });
  }
  function sourceList(ids) {
    $('details').append(el('h3', 'Evidence'));
    if (!ids?.length) { $('details').append(el('p', 'No supporting source supplied. Treat this as unverified.')); return; }
    for (const id of ids) {
      const item = evidence.get(id), block = el('div', undefined, 'source');
      block.append(el('code', item.source));
      if (item.note) block.append(el('p', item.note));
      $('details').append(block);
    }
  }
  function inspect(item, kind = 'component') {
    selected = kind === 'component' ? item.id : null;
    $('details').replaceChildren(el('span', item.status, `badge ${item.status}`), el('h2', item.label));
    if (item.description) $('details').append(el('p', item.description));
    if (item.path) { $('details').append(el('h3', 'Source location'), el('code', item.path)); }
    if (kind === 'edge') $('details').append(el('p', `${components.get(item.from).label} → ${components.get(item.to).label}`));
    if (item.detail) $('details').append(button('Explore component →', () => navigate(item.detail, [...trail, item.detail]), 'primary'));
    sourceList(item.evidence);
    $('inspector').classList.add('open');
    document.querySelectorAll('.node').forEach(n => n.setAttribute('aria-pressed', String(n.dataset.id === selected)));
    if (innerWidth <= 1100) $('inspector').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function resetInspector() {
    selected = null;
    $('details').replaceChildren(el('h2', 'Every connection has a story.'), el('p', 'Select a component or relationship to read its responsibility and evidence.'));
    $('inspector').classList.remove('open');
  }
  function navigate(id, history = [id], focus = true) {
    current = id; trail = history; scale = 1;
    resetInspector(); render();
    if (focus) {
      $('view-title').focus({ preventScroll: true });
      if (narrow.matches) $('view-title').scrollIntoView({ block: 'start' });
    }
  }
  function render() {
    const view = views.get(current);
    $('view-title').textContent = view.title; $('question').textContent = view.question ?? '';
    $('count').textContent = `${view.nodes.length} components`;
    $('breadcrumbs').replaceChildren();
    trail.forEach((id, i) => { if (i) $('breadcrumbs').append(el('span', '›')); $('breadcrumbs').append(button(views.get(id).title, () => navigate(id, trail.slice(0, i + 1)))); });
    $('view-list').replaceChildren();
    for (const v of doc.views) { const b = button(v.title, () => navigate(v.id)); if (v.id === current) b.setAttribute('aria-current', 'page'); $('view-list').append(b); }
    const graph = $('graph'); graph.replaceChildren();
    const columns = narrow.matches ? 1 : (view.nodes.length <= 4 ? 2 : 3);
    const cardW = 230, cardH = 112, gapX = 90, gapY = 88, pad = 42;
    const W = columns * cardW + (columns - 1) * gapX + pad * 2;
    const rows = Math.ceil(view.nodes.length / columns), H = rows * cardH + (rows - 1) * gapY + pad * 2;
    graph.setAttribute('viewBox', `0 0 ${W} ${H}`); graph.style.width = `${100 * scale}%`;
    const positions = new Map(view.nodes.map((id, i) => [id, { x: pad + (i % columns) * (cardW + gapX), y: pad + Math.floor(i / columns) * (cardH + gapY) }]));
    const defs = svg('defs', {}), marker = svg('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 4.5, markerHeight: 4.5, orient: 'auto-start-reverse' });
    marker.append(svg('path', { d: 'M0 0 L10 5 L0 10z', fill: 'var(--muted)' })); defs.append(marker); graph.append(defs);
    view.edges.forEach((edge, i) => {
      const a = positions.get(edge.from), b = positions.get(edge.to);
      let d, lx, ly;
      if (a.y === b.y && Math.abs(a.x - b.x) === cardW + gapX) {
        const forward = a.x < b.x, x1 = a.x + (forward ? cardW : 0), x2 = b.x + (forward ? 0 : cardW);
        const y1 = a.y + 45 + (i % 3) * 8, y2 = b.y + 45 + (i % 3) * 8;
        lx = (x1 + x2) / 2; ly = y1;
        d = `M${x1} ${y1} C${lx} ${y1},${lx} ${y2},${x2} ${y2}`;
      } else if (a.x === b.x && Math.abs(a.y - b.y) === cardH + gapY) {
        const forward = a.y < b.y, y1 = a.y + (forward ? cardH : 0), y2 = b.y + (forward ? 0 : cardH);
        const x = a.x + cardW / 2 + (i % 3 - 1) * 24;
        lx = x; ly = (y1 + y2) / 2; d = `M${x} ${y1} L${x} ${y2}`;
      } else if (b.y > a.y && b.y - a.y === cardH + gapY) {
        const y1 = a.y + cardH, y2 = b.y, x1 = a.x + cardW / 2, x2 = b.x + cardW / 2;
        ly = (y1 + y2) / 2; lx = (x1 + x2) / 2;
        d = `M${x1} ${y1} C${x1} ${ly},${x2} ${ly},${x2} ${y2}`;
      } else {
        // Route long/backward links through row gaps and the outside gutter.
        const x1 = a.x + cardW / 2, x2 = b.x + cardW / 2;
        const top = a.y + cardH + 20 + i % 3 * 8, bottom = b.y - 18 - i % 3 * 6;
        lx = W - 14 - i % 3 * 10; ly = (top + bottom) / 2;
        d = `M${x1} ${a.y + cardH} V${top} H${lx} V${bottom} H${x2} V${b.y}`;
      }
      graph.append(svg('path', { d, class: `wire ${edge.status}`, 'marker-end': 'url(#arrow)' }));
      const badge = svg('g', { role: 'button', tabindex: 0, 'aria-label': `Relationship ${i + 1}: ${edge.label}` });
      badge.append(svg('circle', { cx: lx, cy: ly, r: 11, fill: 'var(--panel)', stroke: 'var(--line)' }), svg('text', { x: lx, y: ly, class: 'edge-number' }, i + 1));
      activate(badge, () => inspect(edge, 'edge')); graph.append(badge);
    });
    view.nodes.forEach(id => {
      const c = components.get(id), p = positions.get(id);
      const node = svg('g', { class: 'node', role: 'button', tabindex: 0, 'aria-label': `${c.label}, ${c.status}. Inspect evidence.`, 'aria-pressed': String(selected === id), 'data-id': id });
      node.append(svg('title', {}, c.label), svg('rect', { x: p.x, y: p.y, width: cardW, height: cardH, rx: 12, class: 'node-body' }), svg('circle', { cx: p.x + 18, cy: p.y + 22, r: 3, fill: statusColor(c.status) }), svg('text', { x: p.x + 29, y: p.y + 26, class: 'node-copy' }, c.status.toUpperCase()), svg('text', { x: p.x + 16, y: p.y + 53, class: 'node-title' }, fitText(c.label, cardW - 32, '700 14px system-ui')), svg('text', { x: p.x + 16, y: p.y + 74, class: 'node-copy' }, fitText(c.path ?? c.description ?? 'Inspect evidence', cardW - 32, '10px system-ui')));
      activate(node, () => inspect(c)); graph.append(node);
      if (c.detail) {
        const detail = svg('g', { role: 'button', tabindex: 0, 'aria-label': `Explore ${c.label}` });
        detail.append(svg('rect', { x: p.x + 10, y: p.y + 80, width: cardW - 20, height: 27, fill: 'transparent' }), svg('text', { x: p.x + 16, y: p.y + 99, class: 'node-detail' }, 'Explore detail →'));
        activate(detail, () => navigate(c.detail, [...trail, c.detail])); graph.append(detail);
      }
    });
    $('edge-count').textContent = `(${view.edges.length})`; $('relationships').replaceChildren();
    if (!view.edges.length) $('relationships').append(el('p', 'No relationships supplied for this view.', 'empty'));
    view.edges.forEach((edge, i) => {
      const b = button('', () => inspect(edge, 'edge'), 'edge-row');
      const body = el('span', edge.label); body.append(el('small', `${components.get(edge.from).label} → ${components.get(edge.to).label}`));
      b.append(el('span', i + 1, 'edge-index'), body, el('span', edge.status, `badge ${edge.status}`)); $('relationships').append(b);
    });
  }
  $('nav-toggle').addEventListener('click', () => { const expanded = document.querySelector('.views').classList.toggle('expanded'); $('nav-toggle').setAttribute('aria-expanded', String(expanded)); });
  $('search').addEventListener('input', () => {
    const query = $('search').value.trim().toLocaleLowerCase(); $('search-results').replaceChildren();
    if (!query) return;
    const matches = doc.components.filter(c => `${c.label} ${c.path ?? ''}`.toLocaleLowerCase().includes(query));
    for (const c of matches.slice(0, 20)) $('search-results').append(button(c.label, () => { const v = doc.views.find(v => v.nodes.includes(c.id)); navigate(v.id); inspect(c); }));
    if (!matches.length) $('search-results').append(el('p', 'No matching components.', 'empty'));
    if (matches.length > 20) $('search-results').append(el('p', 'Showing 20 results. Refine your search.', 'empty'));
  });
  const requestedTheme = new URLSearchParams(location.search).get('theme');
  document.body.classList.toggle('light', requestedTheme === 'light' || (requestedTheme !== 'dark' && matchMedia('(prefers-color-scheme: light)').matches));
  function syncTheme() { $('theme').setAttribute('aria-pressed', String(document.body.classList.contains('light'))); }
  syncTheme();
  $('theme').addEventListener('click', () => { document.body.classList.toggle('light'); syncTheme(); });
  $('zoom-in').addEventListener('click', () => { scale = Math.min(3, scale + .25); $('graph').style.width = `${scale * 100}%`; });
  $('zoom-out').addEventListener('click', () => { scale = Math.max(1, scale - .25); $('graph').style.width = `${scale * 100}%`; });
  $('fit').addEventListener('click', () => { scale = 1; $('graph').style.width = '100%'; $('canvas').scrollTo(0, 0); });
  $('close').addEventListener('click', () => { resetInspector(); render(); $('view-title').focus({ preventScroll: true }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('inspector').classList.contains('open')) $('close').click(); });
  document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); navigate(doc.root); });
  $('download').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })); const a = el('a'); a.href = url; a.download = 'diago-explorer.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  narrow.addEventListener('change', render);
  navigate(doc.root, [doc.root], false);
})();
