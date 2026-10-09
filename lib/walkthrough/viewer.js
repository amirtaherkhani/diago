// Read rendered, escaped metadata instead of duplicating diagram JSON in the output.
(() => {
  function boot() {
    const host = document.querySelector('.diagram-container, .canvas');
    if (!host) return;
    const graphs = [...host.querySelectorAll('svg')].filter(s => s.querySelector('[data-node-id]'));
    if (!graphs.length) return;
    const graph = () => graphs.find(s => s.getBoundingClientRect().width > 0) || graphs[0];
    const root = document.createElement('details');
    root.className = 'diago-walkthrough';
    root.innerHTML = `<summary>Guided walkthrough</summary><p class="walk-note">Review authored connections in diagram order. This is not an inferred execution sequence. While open, click a node to jump to its first connection.</p><div class="walk-controls"><label>Connections <select aria-label="Walkthrough connections"></select></label><button type="button" data-action="previous">Previous</button><button type="button" data-action="next">Next</button><button type="button" data-action="play">Play</button><button type="button" data-action="markdown">Download walkthrough Markdown</button></div><progress aria-label="Walkthrough progress" value="0" max="1"></progress><div role="status" aria-live="polite"><p class="walk-title"></p><p class="walk-route"></p><p class="walk-description"></p></div>`;
    host.before(root);
    const select = root.querySelector('select');
    const title = root.querySelector('.walk-title');
    const route = root.querySelector('.walk-route');
    const description = root.querySelector('.walk-description');
    const progress = root.querySelector('progress');
    const button = action => root.querySelector(`[data-action="${action}"]`);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0, timer = null, steps = [], nodes = new Map(), all = [];
    const option = (label, value) => { const o = document.createElement('option'); o.textContent = label; o.value = value; select.append(o); };
    const symbol = edge => edge.dataset.arrowType === 'association' ? '—' : edge.dataset.arrowType === 'bidirectional' ? '↔' : '→';
    const label = id => nodes.get(id)?.dataset.nodeLabel || id;
    function clear() { host.querySelectorAll('[data-diago-walk]').forEach(e => e.removeAttribute('data-diago-walk')); }
    function stop() { clearInterval(timer); timer = null; button('play').textContent = 'Play'; button('play').setAttribute('aria-pressed', 'false'); }
    function collect() {
      const g = graph();
      nodes = new Map([...g.querySelectorAll('[data-node-id]')].map(n => [n.dataset.nodeId, n]));
      all = [...g.querySelectorAll('[data-edge-from][data-edge-to]')].filter(e => nodes.has(e.dataset.edgeFrom) && nodes.has(e.dataset.edgeTo));
      // A renderer may repeat one edge for a hit target; keep distinct authored edges.
      const seen = new Set();
      all = all.filter(e => { const k = e.dataset.edgeId || e.dataset.edgeKey; if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; });
      const chosen = select.value;
      select.replaceChildren(); option('All connections', '');
      for (const [id] of nodes) if (all.some(e => e.dataset.edgeFrom === id || e.dataset.edgeTo === id)) option(`Around ${label(id)}`, id);
      if ([...select.options].some(o => o.value === chosen)) select.value = chosen;
      steps = all.filter(e => !select.value || e.dataset.edgeFrom === select.value || e.dataset.edgeTo === select.value);
      index = Math.min(index, Math.max(0, steps.length - 1));
    }
    function paint() {
      clear();
      const step = steps[index];
      button('previous').disabled = !step || index === 0;
      button('next').disabled = !step || index === steps.length - 1;
      button('play').disabled = !step || steps.length < 2 || reduced.matches;
      button('play').title = reduced.matches ? 'Automatic playback is disabled for reduced motion. Use Next.' : 'Advance every three seconds';
      progress.max = Math.max(1, steps.length); progress.value = step ? index + 1 : 0;
      if (!step) { title.textContent = 'No authored connections in this view.'; route.textContent = ''; description.textContent = ''; stop(); return; }
      const participants = new Set(steps.flatMap(e => [e.dataset.edgeFrom, e.dataset.edgeTo]));
      for (const [id, node] of nodes) node.dataset.diagoWalk = participants.has(id) ? 'participant' : 'dimmed';
      all.forEach(e => { e.dataset.diagoWalk = steps.includes(e) ? 'participant' : 'dimmed'; });
      nodes.get(step.dataset.edgeFrom).dataset.diagoWalk = 'source';
      nodes.get(step.dataset.edgeTo).dataset.diagoWalk = 'active'; step.dataset.diagoWalk = 'active';
      title.textContent = `${index + 1} / ${steps.length} · ${step.dataset.edgeLabel || 'Connection'}`;
      route.textContent = `${label(step.dataset.edgeFrom)} ${symbol(step)} ${label(step.dataset.edgeTo)}`;
      description.textContent = nodes.get(step.dataset.edgeTo).getAttribute('aria-label') || label(step.dataset.edgeTo);
    }
    function move(delta) { stop(); index = Math.max(0, Math.min(steps.length - 1, index + delta)); paint(); }
    root.addEventListener('toggle', () => { stop(); if (root.open) { collect(); paint(); } else clear(); });
    select.addEventListener('change', () => { stop(); index = 0; collect(); paint(); });
    button('previous').addEventListener('click', () => move(-1));
    button('next').addEventListener('click', () => move(1));
    button('play').addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (reduced.matches || steps.length < 2) return;
      if (index === steps.length - 1) index = 0;
      paint(); button('play').textContent = 'Pause'; button('play').setAttribute('aria-pressed', 'true');
      timer = setInterval(() => { if (index >= steps.length - 1) { stop(); return; } index++; paint(); if (index === steps.length - 1) stop(); }, 3000);
    });
    root.addEventListener('keydown', e => {
      if (e.target.tagName === 'SELECT' || !root.open || !['ArrowRight','ArrowLeft'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation(); move(e.key === 'ArrowRight' ? 1 : -1);
    });
    function jump(e) {
      if (e.type === 'keydown' && !['Enter',' '].includes(e.key)) return;
      const node = e.target.closest('[data-node-id]'); if (!node || !host.contains(node)) return;
      if (!root.open) {
        if (!host.classList.contains('canvas')) return;
        root.open = true; collect();
      }
      e.preventDefault(); e.stopImmediatePropagation(); stop();
      const found = steps.findIndex(s => s.dataset.edgeFrom === node.dataset.nodeId || s.dataset.edgeTo === node.dataset.nodeId);
      if (found < 0) { description.textContent = `${label(node.dataset.nodeId)} is outside the selected connections. Choose All connections to inspect it.`; return; }
      index = found; paint();
    }
    host.addEventListener('click', jump, true); host.addEventListener('keydown', jump, true);
    button('markdown').addEventListener('click', () => {
      const text = `# ${document.title}\n\nAuthored connection walkthrough; order does not imply execution.\n\n` + steps.map((s,i) => `${i+1}. ${label(s.dataset.edgeFrom)} ${symbol(s)} ${label(s.dataset.edgeTo)}: ${s.dataset.edgeLabel || 'Connection'}\n   ${nodes.get(s.dataset.edgeTo).getAttribute('aria-label') || ''}`).join('\n');
      const url = URL.createObjectURL(new Blob([text], {type:'text/markdown'})); const a = document.createElement('a'); a.href = url; a.download = 'diago-walkthrough.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    reduced.addEventListener('change', () => { stop(); if (root.open) paint(); });
    let frame;
    window.addEventListener('resize', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { if (root.open) { stop(); collect(); paint(); } }); });
    // Export stays a neutral complete diagram; the active teaching state is transient.
    document.getElementById('btn-export')?.addEventListener('click', () => { root.open = false; stop(); clear(); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
