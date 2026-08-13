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
}

function createPreviewFixture() {
  const tabs = HERO_VIEWS.map(() => new FakeElement());
  const panels = HERO_VIEWS.map(() => new FakeElement());
  const title = new FakeElement();
  const toggle = new FakeElement();
  const ownerDocument = new FakeEventTarget();
  ownerDocument.hidden = false;
  const mediaQuery = new FakeEventTarget();
  mediaQuery.matches = false;
  const root = new FakeElement();
  root.ownerDocument = ownerDocument;
  root.querySelectorAll = (selector) => selector === '[data-diagram-view]' ? tabs : panels;
  root.querySelector = (selector) => selector === '[data-preview-title]' ? title : toggle;
  root.contains = (element) => element === root || tabs.includes(element) || panels.includes(element) || element === title || element === toggle;

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
  return { controller, root, tabs, panels, title, toggle, ownerDocument, mediaQuery, timers, clearedTimers, runNextTimer };
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
  const listenerTargets = [...fixture.tabs, fixture.toggle, fixture.root, fixture.ownerDocument, fixture.mediaQuery];
  assert.ok(listenerTargets.some((target) => target.listenerCount() > 0));

  fixture.controller.destroy();

  assert.equal(fixture.timers.size, 0);
  assert.ok(fixture.clearedTimers.length > 0);
  assert.ok(listenerTargets.every((target) => target.listenerCount() === 0));
  fixture.tabs[4].dispatch('click');
  assert.equal(fixture.controller.getState().activeIndex, 0);
});
