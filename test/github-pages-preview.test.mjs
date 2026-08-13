import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fromRoot } from '../lib/paths.mjs';
import {
  HERO_VIEWS,
  createDiagramPreview,
  diagramIndexForKey,
  nextDiagramIndex,
  shouldAutoPlay,
} from '../docs/app.js';

const expectedViews = [
  'architecture',
  'sequence',
  'workflow',
  'dataflow',
  'lifecycle',
  'data-model',
  'timeline',
  'layers',
];

const html = fs.readFileSync(fromRoot('docs', 'index.html'), 'utf8');
const css = fs.readFileSync(fromRoot('docs', 'styles.css'), 'utf8');
const design = fs.readFileSync(fromRoot('DESIGN.md'), 'utf8');

test('workbench paint roles are tokenized without changing their approved values', () => {
  const rootCss = css.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
  const workbenchCss = css.slice(
    css.indexOf('.view-switcher button[aria-selected="true"]'),
    css.indexOf('.preview-card rect'),
  );

  assert.doesNotMatch(workbenchCss, /#[0-9a-f]{3,8}\b|rgba?\(/i);
  const expectedTokens = {
    '--workbench-tab-selected-surface': '#1a2634',
    '--workbench-tab-selected-border': '#2c3b4d',
    '--diagram-stage-grid': 'rgba(108, 168, 255, 0.025)',
    '--diagram-grid-line': 'rgba(121, 151, 180, 0.045)',
    '--diagram-boundary-fill': 'rgba(108, 168, 255, 0.025)',
    '--diagram-boundary-border': 'rgba(108, 168, 255, 0.28)',
    '--diagram-boundary-label': '#6f89a4',
    '--diagram-primary-text': '#ecf3f9',
    '--diagram-meta-text': '#8297ab',
    '--diagram-edge-label': '#93a9bd',
    '--sequence-label-surface': '#14202d',
    '--line-strong': '#34465a',
    '--sequence-lifeline': '#2f4256',
    '--sequence-message-text': '#a9b9c8',
    '--preview-lane-line': 'rgba(145, 162, 181, 0.22)',
  };

  for (const [token, value] of Object.entries(expectedTokens)) {
    assert.match(rootCss, new RegExp(`${token}:\\s*${value.replace(/[()]/g, '\\$&')}`));
  }
});

test('preview SVG paint stays token-driven through its node sheen stops', () => {
  const rootCss = css.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
  const previewStart = html.indexOf('data-diagram-preview');
  const previewMarkup = html.slice(previewStart, html.indexOf('</section>', previewStart));

  assert.doesNotMatch(previewMarkup, /#[0-9a-f]{3,8}\b|rgba?\(/i);
  assert.match(rootCss, /--diagram-node-sheen-start:\s*#142332/);
  assert.match(rootCss, /--diagram-node-sheen-end:\s*#101924/);
  assert.match(html, /<stop class="node-sheen-start" offset="0"\/>/);
  assert.match(html, /<stop class="node-sheen-end" offset="1"\/>/);
  assert.match(css, /\.node-sheen-start\s*\{[^}]*stop-color:\s*var\(--diagram-node-sheen-start\)/s);
  assert.match(css, /\.node-sheen-end\s*\{[^}]*stop-color:\s*var\(--diagram-node-sheen-end\)/s);
});

test('workbench component uses documented material, typography, and geometry tokens', () => {
  const rootCss = css.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
  const componentCss = css.slice(css.indexOf('.workbench {'), css.indexOf('.evidence-panel {'));

  assert.doesNotMatch(componentCss, /#[0-9a-f]{3,8}\b|rgba?\(/i);
  assert.doesNotMatch(componentCss, /-?\d+(?:\.\d+)?(?:px|rem)\b/);
  for (const token of [
    '--workbench-shell-border',
    '--workbench-shell-surface',
    '--workbench-shell-shadow',
    '--workbench-dot-idle',
    '--workbench-type-chrome',
    '--workbench-type-tab',
    '--diagram-type-node',
    '--diagram-stroke-primary',
    '--diagram-dash-standard',
    '--workbench-chrome-height',
    '--workbench-tab-button-padding',
    '--diagram-grid-step',
  ]) {
    assert.match(rootCss, new RegExp(`${token}:`));
    assert.match(design, new RegExp(`\`${token}\``));
  }
});

test('preview CSS defines eight-view geometry, playback progress, and reduced-motion safety', () => {
  assert.match(css, /\.view-switcher\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.view-switcher\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.match(css, /\[data-preview-running="true"\]/);
  assert.match(css, /@keyframes preview-progress/);
  assert.match(css, /@keyframes preview-panel-in/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.diagram-view/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.flow-lines path\s*\{[^}]*animation:\s*none !important/s);
});

test('preview primitives keep semantic edges readable and diagrams pannable on narrow screens', () => {
  const reducedMotionCss = css.split('@media (prefers-reduced-motion: reduce)')[1] ?? '';

  assert.match(css, /\.diagram-view \[data-animate-edge\] \.flow-primary\s*\{[^}]*stroke:\s*var\(--blue\)[^}]*stroke-width:\s*var\(--diagram-stroke-primary\)/s);
  assert.match(css, /\.diagram-view \[data-animate-edge\] \.flow-secondary\s*\{[^}]*stroke:\s*var\(--mint\)[^}]*stroke-dasharray:\s*var\(--diagram-dash-standard\)/s);
  assert.match(css, /\.diagram-view marker path\s*\{[^}]*fill:\s*context-stroke/s);
  assert.match(css, /\.diagram-view \[data-animate-edge\] text\s*\{[^}]*fill:\s*var\(--muted\)/s);
  assert.match(css, /\.diagram-node \.node-highlight rect\s*\{[^}]*fill:\s*var\(--surface-verified\)/s);
  assert.match(css, /\.diagram-node \.node-provider rect\s*\{[^}]*stroke:\s*var\(--orange\)/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.diagram-stage\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.diagram-stage \.diagram-view\s*\{[^}]*min-width:\s*640px/s);
  assert.match(reducedMotionCss, /\.view-switcher button::after[\s\S]*opacity:\s*0/);
  assert.doesNotMatch(html, /gradient-(workflow|dataflow|lifecycle|data-model|timeline|layers)/);
  assert.match(html, /class="timeline-first-milestone" data-timeline-track="application"><circle cx="17[0-9]" cy="92" r="12"\/><text x="17[0-9]" y="72"/);
  assert.match(html, /<path class="flow-primary" d="M18[2-9] 92C/);
});

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0);
  }
}

class FakeElement extends FakeEventTarget {
  constructor() {
    super();
    this.attributes = new Map();
    this.classNames = new Set();
    this.classList = {
      toggle: (name, enabled) => enabled ? this.classNames.add(name) : this.classNames.delete(name),
      contains: (name) => this.classNames.has(name),
    };
    this.dataset = {};
    this.hidden = false;
    this.tabIndex = -1;
    this.textContent = '';
    this.title = '';
    this.focused = false;
    this.scrollCalls = [];
    this.scrollPositionCalls = [];
    this.scrollLeft = 0;
    this.clientWidth = 320;
    this.scrollWidth = 640;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  focus() {
    this.focused = true;
  }

  scrollIntoView(options) {
    this.scrollCalls.push(options);
  }

  scrollTo(options) {
    this.scrollPositionCalls.push(options);
    this.scrollLeft = options.left;
  }
}

function createPreviewFixture() {
  const tabs = HERO_VIEWS.map(() => new FakeElement());
  const panels = HERO_VIEWS.map(() => new FakeElement());
  const title = new FakeElement();
  const toggle = new FakeElement();
  const stage = new FakeElement();
  const ownerDocument = new FakeEventTarget();
  ownerDocument.hidden = false;
  const mediaQuery = new FakeEventTarget();
  mediaQuery.matches = false;
  const root = new FakeElement();
  root.ownerDocument = ownerDocument;
  root.querySelectorAll = (selector) => selector === '[data-diagram-view]' ? tabs : panels;
  root.querySelector = (selector) => {
    if (selector === '[data-preview-title]') return title;
    if (selector === '[data-preview-toggle]') return toggle;
    if (selector === '[data-diagram-stage]') return stage;
    throw new Error(`Unexpected selector: ${selector}`);
  };
  root.contains = (element) => element === root || tabs.includes(element) || panels.includes(element) || element === title || element === toggle || element === stage;

  let nextTimerId = 1;
  const timers = new Map();
  const clearedTimers = [];
  const environment = {
    matchMedia: () => mediaQuery,
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      clearedTimers.push(id);
      timers.delete(id);
    },
  };
  const runNextTimer = () => {
    const [id, timer] = timers.entries().next().value;
    timers.delete(id);
    timer.callback();
  };

  const controller = createDiagramPreview(root, environment);
  return { controller, root, tabs, panels, title, toggle, stage, ownerDocument, mediaQuery, timers, clearedTimers, runNextTimer };
}

test('hero metadata exposes exactly the eight renderer views in catalog order', () => {
  assert.deepEqual(HERO_VIEWS.map(({ id }) => id), expectedViews);
  assert.equal(new Set(HERO_VIEWS.map(({ filename }) => filename)).size, 8);
  assert.ok(HERO_VIEWS.every(({ question }) => question.endsWith('?')));
});

test('preview state wraps, supports tab keys, and respects every pause reason', () => {
  assert.equal(nextDiagramIndex(0), 1);
  assert.equal(nextDiagramIndex(7), 0);
  assert.equal(diagramIndexForKey('ArrowRight', 7), 0);
  assert.equal(diagramIndexForKey('ArrowLeft', 0), 7);
  assert.equal(diagramIndexForKey('Home', 5), 0);
  assert.equal(diagramIndexForKey('End', 2), 7);
  assert.equal(diagramIndexForKey('Enter', 2), null);
  assert.equal(shouldAutoPlay({ userPaused: false, reducedMotion: false, holdReasons: new Set() }), true);
  assert.equal(shouldAutoPlay({ userPaused: true, reducedMotion: false, holdReasons: new Set() }), false);
  assert.equal(shouldAutoPlay({ userPaused: false, reducedMotion: true, holdReasons: new Set() }), false);
  assert.equal(shouldAutoPlay({ userPaused: false, reducedMotion: false, holdReasons: new Set(['focus']) }), false);
});

test('hero markup wires exactly eight accessible tabs to eight panels', () => {
  const tabs = [...html.matchAll(/data-diagram-view="([^"]+)"/g)].map((match) => match[1]);
  const panels = [...html.matchAll(/data-view-panel="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(tabs, expectedViews);
  assert.deepEqual(panels, expectedViews);
  assert.doesNotMatch(html, /data-diagram-view="evidence"/);
  assert.match(html, /data-preview-toggle[^>]*hidden/);
  assert.match(html, /<p id="diagram-stage-hint" class="diagram-stage-hint">Swipe or use arrow keys to pan the diagram\.<\/p>/);
  assert.match(html, /<div class="diagram-stage" role="region" tabindex="0" aria-label="Diagram canvas" aria-describedby="diagram-stage-hint" data-diagram-stage>/);
  assert.match(css, /\.diagram-stage-hint\s*\{[^}]*clip:/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.diagram-stage-hint\s*\{[^}]*position:\s*static/s);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
  for (const view of expectedViews) {
    assert.match(html, new RegExp(`id="preview-tab-${view}"[^>]+aria-controls="preview-panel-${view}"`));
    assert.match(html, new RegExp(`id="preview-panel-${view}"[^>]+aria-labelledby="preview-tab-${view}"`));
  }
  assert.match(html, /id="preview-panel-architecture"(?![^>]*hidden)/);
  for (const view of expectedViews.slice(1)) {
    assert.match(html, new RegExp(`id="preview-panel-${view}"[^>]*hidden`));
  }
});

test('focused diagram stage pans only its internal overflow with keyboard controls', () => {
  const fixture = createPreviewFixture();
  const press = (key) => {
    const event = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    fixture.stage.dispatch('keydown', event);
    assert.equal(event.defaultPrevented, true);
  };

  press('ArrowRight');
  assert.equal(fixture.stage.scrollLeft, 256);
  press('End');
  assert.equal(fixture.stage.scrollLeft, 320);
  press('ArrowLeft');
  assert.equal(fixture.stage.scrollLeft, 64);
  press('Home');
  assert.equal(fixture.stage.scrollLeft, 0);
  assert.equal(fixture.stage.scrollPositionCalls.at(-1).behavior, 'smooth');
});

test('controller activation updates the roving tab, mounted panel, and filename', () => {
  const fixture = createPreviewFixture();

  fixture.controller.activate(3, { focus: true, scroll: true });

  assert.equal(fixture.tabs[3].getAttribute('aria-selected'), 'true');
  assert.equal(fixture.tabs[3].tabIndex, 0);
  assert.equal(fixture.tabs[0].getAttribute('aria-selected'), 'false');
  assert.equal(fixture.tabs[0].tabIndex, -1);
  assert.equal(fixture.tabs[3].focused, true);
  assert.equal(fixture.tabs[3].scrollCalls.length, 1);
  assert.equal(fixture.panels[3].hidden, false);
  assert.equal(fixture.panels[3].classList.contains('is-active'), true);
  assert.equal(fixture.panels[0].hidden, true);
  assert.equal(fixture.panels[0].classList.contains('is-active'), false);
  assert.equal(fixture.title.textContent, HERO_VIEWS[3].filename);
  assert.equal(fixture.title.title, HERO_VIEWS[3].filename);
  assert.equal(fixture.root.dataset.activeView, 'dataflow');
});

test('controller schedules 5000ms playback and wraps after the final view', () => {
  const fixture = createPreviewFixture();
  fixture.controller.activate(7);

  fixture.runNextTimer();

  assert.equal(fixture.controller.getState().activeIndex, 0);
  assert.equal(fixture.root.dataset.activeView, 'architecture');
  assert.equal(fixture.timers.size, 1);
  assert.equal([...fixture.timers.values()][0].delay, 5000);
});

test('playback control cancels and restores scheduling with an accessible label', () => {
  const fixture = createPreviewFixture();

  fixture.toggle.dispatch('click');

  assert.equal(fixture.controller.getState().userPaused, true);
  assert.equal(fixture.root.dataset.previewRunning, 'false');
  assert.equal(fixture.timers.size, 0);
  assert.equal(fixture.toggle.textContent, 'Play');
  assert.equal(fixture.toggle.getAttribute('aria-label'), 'Play diagram preview');

  fixture.toggle.dispatch('click');
  assert.equal(fixture.controller.getState().userPaused, false);
  assert.equal(fixture.root.dataset.previewRunning, 'true');
  assert.equal(fixture.timers.size, 1);
  assert.equal(fixture.toggle.textContent, 'Pause');
  assert.equal(fixture.toggle.getAttribute('aria-label'), 'Pause diagram preview');
});

test('pointer, focus, and document visibility independently hold playback', () => {
  const fixture = createPreviewFixture();
  const holdScenarios = [
    { reason: 'pointer', hold: () => fixture.root.dispatch('mouseenter'), release: () => fixture.root.dispatch('mouseleave') },
    { reason: 'focus', hold: () => fixture.root.dispatch('focusin'), release: () => fixture.root.dispatch('focusout', { relatedTarget: new FakeElement() }) },
    { reason: 'hidden', hold: () => { fixture.ownerDocument.hidden = true; fixture.ownerDocument.dispatch('visibilitychange'); }, release: () => { fixture.ownerDocument.hidden = false; fixture.ownerDocument.dispatch('visibilitychange'); } },
  ];

  for (const { reason, hold, release } of holdScenarios) {
    hold();
    assert.deepEqual([...fixture.controller.getState().holdReasons], [reason]);
    assert.equal(fixture.root.dataset.previewRunning, 'false');
    assert.equal(fixture.timers.size, 0);
    release();
    assert.equal(fixture.controller.getState().holdReasons.size, 0);
    assert.equal(fixture.root.dataset.previewRunning, 'true');
    assert.equal(fixture.timers.size, 1);
  }
});

test('reduced motion resets the first panel, hides playback, and stops scheduling', () => {
  const fixture = createPreviewFixture();
  fixture.controller.activate(5);

  fixture.mediaQuery.matches = true;
  fixture.mediaQuery.dispatch('change');

  assert.equal(fixture.controller.getState().activeIndex, 0);
  assert.equal(fixture.panels[0].hidden, false);
  assert.equal(fixture.panels[5].hidden, true);
  assert.equal(fixture.toggle.hidden, true);
  assert.equal(fixture.timers.size, 0);
  assert.equal(fixture.tabs[0].scrollCalls.at(-1).behavior, 'auto');

  fixture.mediaQuery.matches = false;
  fixture.mediaQuery.dispatch('change');
  assert.equal(fixture.toggle.hidden, false);
  assert.equal(fixture.timers.size, 1);
});

test('destroy clears the timer and removes every controller listener', () => {
  const fixture = createPreviewFixture();
  const listenerTargets = [...fixture.tabs, fixture.toggle, fixture.stage, fixture.root, fixture.ownerDocument, fixture.mediaQuery];
  assert.ok(listenerTargets.some((target) => target.listenerCount() > 0));

  fixture.controller.destroy();

  assert.equal(fixture.timers.size, 0);
  assert.ok(fixture.clearedTimers.length > 0);
  assert.ok(listenerTargets.every((target) => target.listenerCount() === 0));
  fixture.tabs[4].dispatch('click');
  assert.equal(fixture.controller.getState().activeIndex, 0);
});
