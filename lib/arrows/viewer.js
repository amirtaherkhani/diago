(() => {
  const model = document.currentScript.dataset.diagoArrowModel;
  const types = {
    directed: ['Directed', 'One-way connection, read from source to arrowhead.', 'M1 1 L9 5 L1 9 Z', true],
    response: ['Response', 'A reply to an earlier interaction; follow the authored direction.', 'M1 1 L9 5 L1 9', false],
    event: ['Event', 'An explicitly authored event or asynchronous notification.', 'M0 1 L4 5 L0 9 M5 1 L9 5 L5 9', false],
    dependency: ['Dependency', 'A required relationship; the label states prerequisite/dependent direction.', 'M1 1 L9 5 L1 9 Z', false],
    bidirectional: ['Bidirectional', 'The same relationship is explicitly valid in both directions.', 'M1 1 L9 5 L1 9 Z', true],
    association: ['Association', 'A structural relationship without implied flow; read cardinality labels.', '', false],
    effect: ['Observed effect', 'Fishbone spine points to the observed effect. Branches do not prove causation.', 'M1 1 L9 5 L1 9 Z', true],
  };
  const svg = (tag, attrs) => { const node = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); return node; };
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };
  function marker(id, type) {
    const node = svg('marker', {id, viewBox:'0 0 10 10', refX:9, refY:5, markerWidth:model==='explorer'?4.5:5.25, markerHeight:model==='explorer'?4.5:5.25, orient:'auto-start-reverse'});
    const entry = types[type];
    node.append(svg('path', {d:entry[2], fill:entry[3] ? 'context-stroke' : type === 'dependency' ? 'var(--panel)' : 'none', stroke:'context-stroke', 'stroke-width':1.3, 'stroke-linecap':'round', 'stroke-linejoin':'round'}));
    return node;
  }
  function sample(type) {
    const entry = types[type], icon = svg('svg', {viewBox:'0 0 64 26', 'aria-hidden':'true', focusable:'false'});
    icon.append(svg('path', {d:'M8 13 H54', fill:'none', stroke:'currentColor', 'stroke-width':1.5}));
    if (entry[2]) {
      const attrs = {d:entry[2],fill:entry[3] ? 'currentColor' : type === 'dependency' ? 'var(--panel)' : 'none',stroke:'currentColor','stroke-width':1.3};
      icon.append(svg('path',{...attrs,transform:'translate(49 9) scale(.8)'}));
      if(type==='bidirectional') icon.append(svg('path',{...attrs,transform:'translate(13 17) rotate(180) scale(.8)'}));
    }
    return icon;
  }
  function item(type, count) {
    const entry = types[type], row = el('li'), copy = el('span');
    row.append(sample(type), copy); copy.append(el('strong', `${entry[0]}${count ? ` · ${count}` : ''}`), el('span', entry[1], 'arrow-description')); return row;
  }
  function boot() {
    const host = document.querySelector('.canvas, .diagram-container, #canvas');
    if (!host) return;
    const guide = el('details', null, 'diago-arrow-guide');
    guide.append(el('summary', 'Arrow guide'));
    const body = el('div', null, 'arrow-body'), note = el('p'), used = el('ul');
    const routeNote = el('p', 'Route tracing follows authored endpoints. To trace both directions, supply two directed connections.');
    routeNote.hidden = true;
    used.setAttribute('aria-label','Connection types in this view');
    body.append(note, used, routeNote, el('p', 'Arrowheads show connection meaning. Colors and line dashes retain this model’s existing status or classification meaning. Read its evidence legend separately.'));
    const catalog = el('details',null,'arrow-catalog'); catalog.append(el('summary','All six Diago connection types'));
    const all = el('ul'); Object.keys(types).filter(t=>t!=='effect').forEach(t=>all.append(item(t))); catalog.append(all);
    body.append(catalog,el('p','This is Diago notation, not a complete UML notation. Only author a type supported by the model and source evidence.'));
    guide.append(body); host.before(guide);
    function refresh() {
      const counts = new Map();
      [...host.querySelectorAll('svg')].forEach((graph, index) => {
        const seen = new Set();
        let defs = graph.querySelector('defs');
        if (!defs) { defs = svg('defs',{}); graph.prepend(defs); }
        for (const type of Object.keys(types)) if (types[type][2]) {
          const id = `diago-arrow-${index}-${type}`;
          if (!graph.querySelector(`#${id}`)) defs.append(marker(id,type));
        }
        for (const edge of graph.querySelectorAll('[data-arrow-type]')) {
          // Upstream hit/focus rails clone connector attributes, but are not
          // visible authored edges. Never add heads or focus stops to them.
          if (edge.closest('.relationship-hit-target')) { edge.removeAttribute('data-arrow-type'); continue; }
          const type = edge.dataset.arrowType, entry = types[type]; if (!entry) continue;
          const paths = edge.matches('path,line,polyline') ? [edge] : [...edge.querySelectorAll('path[marker-end],line[marker-end],polyline[marker-end]')];
          for (const path of paths) {
            path.setAttribute('marker-end',type==='association'?'none':`url(#diago-arrow-${index}-${type})`);
            path.setAttribute('marker-start',type==='bidirectional'?`url(#diago-arrow-${index}-${type})`:'none');
          }
          // Retain author labels. Native title supports hover; aria text also
          // exposes the helper to keyboard and assistive-technology users.
          if (!edge.hasAttribute('data-arrow-described')) {
            const original = edge.getAttribute('aria-label') || edge.dataset.edgeLabel || entry[0];
            edge.setAttribute('aria-label',`${entry[0]}. ${original}. ${entry[1]}`);
            edge.setAttribute('tabindex','0'); edge.setAttribute('role','img');
            const title = svg('title',{}); title.textContent = `${entry[0]}: ${original}`;
            edge.prepend(title); edge.dataset.arrowDescribed='true';
          }
          const bounds = edge.getBoundingClientRect();
          const key = edge.dataset.edgeId ?? edge.dataset.edgeKey ?? edge;
          if (graph.getBoundingClientRect().width > 0 && (bounds.width > 0 || bounds.height > 0) && !seen.has(key)) {
            seen.add(key); counts.set(type,(counts.get(type)||0)+1);
          }
        }
      });
      used.replaceChildren(); counts.forEach((count,type)=>used.append(item(type,count)));
      routeNote.hidden = model !== 'architecture' || !counts.has('bidirectional');
      note.textContent = model==='security-matrix' ? 'This model is a permission grid. Cells express access; no arrows or execution order are implied.' : model==='fishbone' ? 'The spine points to one observed effect. Category branches group investigated candidates, not proven causal links.' : counts.size ? 'Types used in this view. Follow each connection’s label and arrowhead; diagram order alone does not imply execution.' : 'This view has no authored connections. No direction is inferred.';
    }
    refresh();
    let frame;
    window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh);});
    document.addEventListener('diago:graph-render',refresh);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
