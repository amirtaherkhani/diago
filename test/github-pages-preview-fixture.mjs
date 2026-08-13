import { HERO_VIEWS, createDiagramPreview } from '../docs/app.js';

export class FakeEventTarget {
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

export function createPreviewFixture() {
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
