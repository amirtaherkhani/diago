export const HERO_VIEWS = Object.freeze([
  { id: 'architecture', label: 'Architecture', filename: 'checkout-feature.architecture.json', question: 'What exists, who owns it, and how do the boundaries connect?' },
  { id: 'sequence', label: 'Sequence', filename: 'checkout-request.sequence.json', question: 'What happens over time between the caller, services, and providers?' },
  { id: 'workflow', label: 'Workflow', filename: 'schema-rollout.workflow.json', question: 'Which steps, decisions, approvals, and failure paths control the work?' },
  { id: 'dataflow', label: 'Dataflow', filename: 'payment-events.dataflow.json', question: 'Where does data begin, transform, move, and persist?' },
  { id: 'lifecycle', label: 'Lifecycle', filename: 'payment.lifecycle.json', question: 'How does a payment change state, and which guards allow each transition?' },
  { id: 'data-model', label: 'Data model', filename: 'order-domain.data-model.json', question: 'Which entities exist and how are their relationships constrained?' },
  { id: 'timeline', label: 'Timeline', filename: 'payment-migration.timeline.json', question: 'Which engineering milestones happen, and in what temporal relationship?' },
  { id: 'layers', label: 'Layers', filename: 'checkout-controls.layers.json', question: 'Where are responsibilities and controls enforced?' },
]);

export function nextDiagramIndex(currentIndex, total = HERO_VIEWS.length) {
  return (currentIndex + 1) % total;
}

export function diagramIndexForKey(key, currentIndex, total = HERO_VIEWS.length) {
  if (key === 'ArrowRight') return (currentIndex + 1) % total;
  if (key === 'ArrowLeft') return (currentIndex - 1 + total) % total;
  if (key === 'Home') return 0;
  if (key === 'End') return total - 1;
  return null;
}

export function shouldAutoPlay({ userPaused, reducedMotion, holdReasons }) {
  return !userPaused && !reducedMotion && holdReasons.size === 0;
}

export function createDiagramPreview(root, environment = globalThis) {
  const tabs = [...root.querySelectorAll('[data-diagram-view]')];
  const panels = [...root.querySelectorAll('[data-view-panel]')];
  const title = root.querySelector('[data-preview-title]');
  const toggle = root.querySelector('[data-preview-toggle]');
  const stage = root.querySelector('[data-diagram-stage]');
  const reducedMotionQuery = environment.matchMedia('(prefers-reduced-motion: reduce)');
  const holdReasons = new Set();
  let activeIndex = 0;
  let userPaused = false;
  let timerId = null;

  const clearTimer = () => {
    if (timerId !== null) environment.clearTimeout(timerId);
    timerId = null;
  };

  const render = ({ focus = false, scroll = false } = {}) => {
    const activeView = HERO_VIEWS[activeIndex];
    tabs.forEach((tab, index) => {
      const selected = index === activeIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle('is-progressing', selected);
    });
    panels.forEach((panel, index) => {
      const selected = index === activeIndex;
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
    });
    title.textContent = activeView.filename;
    title.title = activeView.filename;
    root.dataset.activeView = activeView.id;
    if (focus) tabs[activeIndex].focus();
    if (scroll) tabs[activeIndex].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
  };

  const syncPlayback = () => {
    clearTimer();
    const running = shouldAutoPlay({ userPaused, reducedMotion: reducedMotionQuery.matches, holdReasons });
    root.dataset.previewRunning = String(running);
    toggle.textContent = userPaused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', userPaused ? 'Play diagram preview' : 'Pause diagram preview');
    if (!running) return;
    timerId = environment.setTimeout(() => {
      activeIndex = nextDiagramIndex(activeIndex, tabs.length);
      render({ scroll: true });
      syncPlayback();
    }, 5000);
  };

  const activate = (index, options = {}) => {
    activeIndex = index;
    render(options);
    syncPlayback();
  };

  const setHold = (reason, held) => {
    if (held) holdReasons.add(reason);
    else holdReasons.delete(reason);
    syncPlayback();
  };

  const tabHandlers = tabs.map((tab, index) => {
    const click = () => activate(index, { scroll: true });
    const keydown = (event) => {
      const targetIndex = diagramIndexForKey(event.key, activeIndex, tabs.length);
      if (targetIndex === null) return;
      event.preventDefault();
      activate(targetIndex, { focus: true, scroll: true });
    };
    tab.addEventListener('click', click);
    tab.addEventListener('keydown', keydown);
    return { tab, click, keydown };
  });

  const panStage = (event) => {
    const maxScrollLeft = Math.max(0, stage.scrollWidth - stage.clientWidth);
    if (maxScrollLeft === 0) return;
    const scrollStep = Math.round(stage.clientWidth * 0.8);
    let scrollLeft = stage.scrollLeft;
    if (event.key === 'ArrowRight') scrollLeft = Math.min(maxScrollLeft, scrollLeft + scrollStep);
    else if (event.key === 'ArrowLeft') scrollLeft = Math.max(0, scrollLeft - scrollStep);
    else if (event.key === 'Home') scrollLeft = 0;
    else if (event.key === 'End') scrollLeft = maxScrollLeft;
    else return;
    event.preventDefault();
    stage.scrollTo({ left: scrollLeft, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
  };

  const togglePlayback = () => {
    userPaused = !userPaused;
    syncPlayback();
  };
  const holdPointer = () => setHold('pointer', true);
  const releasePointer = () => setHold('pointer', false);
  const holdFocus = () => setHold('focus', true);
  const releaseFocus = (event) => {
    if (!root.contains(event.relatedTarget)) setHold('focus', false);
  };
  const ownerDocument = root.ownerDocument;
  const syncVisibility = () => setHold('hidden', ownerDocument.hidden);
  const syncMotionPreference = () => {
    toggle.hidden = reducedMotionQuery.matches;
    if (reducedMotionQuery.matches) activeIndex = 0;
    render({ scroll: true });
    syncPlayback();
  };

  toggle.addEventListener('click', togglePlayback);
  stage.addEventListener('keydown', panStage);
  root.addEventListener('mouseenter', holdPointer);
  root.addEventListener('mouseleave', releasePointer);
  root.addEventListener('focusin', holdFocus);
  root.addEventListener('focusout', releaseFocus);
  ownerDocument.addEventListener('visibilitychange', syncVisibility);
  reducedMotionQuery.addEventListener('change', syncMotionPreference);
  if (ownerDocument.hidden) holdReasons.add('hidden');
  toggle.hidden = reducedMotionQuery.matches;
  render();
  syncPlayback();
  return {
    activate,
    destroy() {
      clearTimer();
      tabHandlers.forEach(({ tab, click, keydown }) => {
        tab.removeEventListener('click', click);
        tab.removeEventListener('keydown', keydown);
      });
      toggle.removeEventListener('click', togglePlayback);
      stage.removeEventListener('keydown', panStage);
      root.removeEventListener('mouseenter', holdPointer);
      root.removeEventListener('mouseleave', releasePointer);
      root.removeEventListener('focusin', holdFocus);
      root.removeEventListener('focusout', releaseFocus);
      ownerDocument.removeEventListener('visibilitychange', syncVisibility);
      reducedMotionQuery.removeEventListener('change', syncMotionPreference);
    },
    getState: () => ({ activeIndex, userPaused, holdReasons: new Set(holdReasons) }),
  };
}

const installOptions = {
  codex: {
    title: 'Install the Codex marketplace',
    description: 'Add the GitHub repository as a marketplace, then install the plugin with its skills and MCP tools.',
    command: 'codex plugin marketplace add amirtaherkhani/diago\ncodex plugin add diago@diago',
  },
  claude: {
    title: 'Install in Claude Code',
    description: 'Add the repository marketplace and install the namespaced skills and MCP tools from Claude Code.',
    command: '/plugin marketplace add amirtaherkhani/diago\n/plugin install diago@diago\n/reload-plugins',
  },
  mcp: {
    title: 'Connect the standard stdio MCP server',
    description: 'Clone Diago and register the same local MCP package with Codex or Claude Code. No cluster, HTTP endpoint, token, or API key is required.',
    command: 'git clone https://github.com/amirtaherkhani/diago.git\ncd diago\n\n# Codex\ncodex mcp add diago -- node "$PWD/mcp/server.mjs"\n\n# Claude Code\nclaude mcp add --transport stdio diago -- node "$PWD/mcp/server.mjs"',
  },
  cli: {
    title: 'Run the deterministic CLI',
    description: 'Clone the repository, inspect the eight-type catalog, and use the advisor, reviewer, validator, and bundled renderers directly.',
    command: 'git clone https://github.com/amirtaherkhani/diago.git\ncd diago\nnode bin/diago.mjs doctor\nnode bin/diago.mjs types --json',
  },
};

export function initializeSite(documentRoot = document) {
  documentRoot.querySelectorAll('[data-diagram-preview]').forEach((root) => createDiagramPreview(root));

  const installTabs = documentRoot.querySelectorAll('[data-install-tab]');
  const installTitle = documentRoot.querySelector('[data-install-title]');
  const installDescription = documentRoot.querySelector('[data-install-description]');
  const installCommand = documentRoot.querySelector('[data-install-command]');
  const menuButton = documentRoot.querySelector('.menu-button');
  const siteNav = documentRoot.querySelector('.site-nav');

  installTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data-install-tab');
      const option = installOptions[selected];
      installTabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      installTitle.textContent = option.title;
      installDescription.textContent = option.description;
      installCommand.textContent = option.command;
    });
  });

  documentRoot.querySelectorAll('[data-copy-target]').forEach((button) => {
    button.addEventListener('click', async () => {
      const target = documentRoot.getElementById(button.getAttribute('data-copy-target'));
      const previous = button.textContent;
      try {
        await navigator.clipboard.writeText(target.innerText);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select text';
      }
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1600);
    });
  });

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    siteNav.classList.toggle('is-open', !isOpen);
  });

  siteNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton?.setAttribute('aria-expanded', 'false');
      siteNav.classList.remove('is-open');
    });
  });
}

if (typeof document !== 'undefined') {
  initializeSite(document);
}
