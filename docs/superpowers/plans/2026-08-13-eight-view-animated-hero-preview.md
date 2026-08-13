# Eight-View Animated Hero Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-tab static hero workbench with an accessible, auto-playing demonstration of all eight Diago software-engineering views.

**Architecture:** Keep the GitHub Pages site dependency-free and progressively enhanced. Semantic HTML and compact inline SVG provide the eight settled views; an exported state/controller layer in `docs/app.js` owns selection, playback, temporary pause reasons, keyboard navigation, filenames, and mobile tab visibility; CSS owns the existing workbench material, responsive tab geometry, one-shot diagram reveals, and reduced-motion behavior.

**Tech Stack:** Static HTML5, CSS custom properties and SVG, browser-native JavaScript modules, Node.js 18+ built-in `node:test`, GitHub Pages, Playwright/Chromium through the existing visual-QA environment.

## Global Constraints

- Renderer order is exactly `architecture`, `sequence`, `workflow`, `dataflow`, `lifecycle`, `data-model`, `timeline`, `layers`.
- Evidence is a cross-cutting semantic layer shown in the footer and inside examples; it is not a ninth tab.
- Auto-play advances every 5,000 milliseconds and completes one eight-view cycle in 40 seconds.
- Architecture is the no-JavaScript and reduced-motion default.
- `prefers-reduced-motion: reduce` disables both automatic view changes and reveal/trace animations.
- Desktop and tablet use a four-column by two-row tab grid; mobile uses one horizontally scrollable, scroll-snapping tab rail.
- Preserve the current page brand, typography, hero copy, section order, evidence colors, and standalone stdio installation language.
- Add no runtime dependency, framework, remote asset, analytics hook, canvas, video, WebGL, or animation library.
- Motion must explain view construction or relationship direction; no perpetual floating, pulsing, or parallax effects.
- Every changed surface must pass fresh 375, 768, and 1280 CSS-pixel visual QA plus two independent review passes before deployment.
- Specifications, implementation plans, phase notes, step documents, and roadmaps are temporary working artifacts; delete them after implementation and before the final merge. Preserve product information, usage, contribution, security, and release documentation.

## File Map

- Create `DESIGN.md`: codify the existing GitHub Pages visual system and the new workbench states before UI code changes.
- Create `test/github-pages-preview.test.mjs`: verify the exact eight-view contract, controller state transitions, semantic tab/panel wiring, and progressive-enhancement defaults.
- Modify `scripts/validate-repo.mjs`: make `DESIGN.md` a required repository artifact.
- Modify `docs/index.html:49,104-229`: load the site script as a module and replace the current three-tab preview with the eight semantic examples and playback control.
- Modify `docs/app.js:1-86`: export deterministic view metadata and state helpers, initialize the preview controller, and preserve install/copy/navigation behavior.
- Modify `docs/styles.css:1-21,323-675,1399-1403,1425-1531,1657-1668`: add named workbench/motion tokens, eight-view primitives, responsive tab geometry, one-shot reveals, and reduced-motion overrides.
- Create temporary visual evidence outside the repository under `/tmp/diago-eight-view-qa/`; never commit QA screenshots.

---

### Task 1: Codify the Existing GitHub Pages Design System

**Files:**
- Create: `DESIGN.md`
- Modify: `scripts/validate-repo.mjs:124-140`

**Interfaces:**
- Consumes: the existing tokens and primitives in `docs/styles.css` and the approved feature specification.
- Produces: the design contract used by every later task, including `Workbench`, `ViewTab`, `DiagramPanel`, `PlaybackControl`, and `EvidenceLegend` states.

- [ ] **Step 1: Write the design-system contract before changing UI code**

Create `DESIGN.md` with these exact sections and decisions:

```markdown
# Diago Web Design System

## 1. Product and Surface
Diago uses a restrained engineering-workbench aesthetic: near-black layered surfaces, cool blue structure, mint verification, amber uncertainty, and orange external-provider emphasis. The hero workbench is the signature material—bordered, gridded, dimensional, and evidence-aware—not a generic dashboard card.

## 2. Tokens
| Role | Token | Value |
|---|---|---|
| Page background | `--bg` | `#0b1018` |
| Elevated background | `--bg-elevated` | `#101722` |
| Surface | `--surface` | `#121b27` |
| Strong surface | `--surface-strong` | `#172331` |
| Border | `--line` | `#253345` |
| Strong diagram border | `--line-strong` | `#34465a` |
| Soft border | `--line-soft` | `rgba(137, 164, 190, 0.16)` |
| Verified surface | `--surface-verified` | `#142a28` |
| Verified border | `--line-verified` | `rgba(110, 243, 197, 0.66)` |
| Structural border | `--line-structure` | `rgba(108, 168, 255, 0.34)` |
| Risk border | `--line-risk` | `rgba(255, 127, 159, 0.62)` |
| Primary text | `--text` | `#f5f8fb` |
| Muted text | `--muted` | `#91a2b5` |
| Strong muted text | `--muted-strong` | `#b8c4d0` |
| Verified | `--mint` | `#6ef3c5` |
| Current relationship | `--blue` | `#6ca8ff` |
| Provider | `--orange` | `#ff9d6c` |
| Risk | `--rose` | `#ff7f9f` |
| Assumption | `--yellow` | `#f2d47a` |
| Focus | `--focus` | `#a8e8ff` |
| Preview cycle | `--preview-cycle` | `5000ms` |
| Preview enter | `--preview-enter` | `260ms` |
| Preview resolve | `--preview-resolve` | `320ms` |
| Preview trace | `--preview-trace` | `420ms` |
| Preview stagger | `--preview-stagger` | `55ms` |
| Preview easing | `--preview-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Preview lift | `--preview-lift` | `8px` |

## 3. Typography
Use the existing sans stack for prose and labels and the existing mono stack for filenames, tabs, edge labels, evidence, and status. Workbench labels remain sentence case; renderer names use the catalog spellings Architecture, Sequence, Workflow, Dataflow, Lifecycle, Data model, Timeline, and Layers.

## 4. Layout and Responsive Rules
The hero remains two columns above 1050px and stacks at 1050px and below. The workbench tablist is a 4 by 2 equal-width grid above 760px. At 760px and below it becomes a one-line horizontal rail with scroll snap, hidden scrollbar, and no page-level overflow. The active tab is scrolled into the nearest visible position.

## 5. Reusable Primitives and States
- `Workbench`: default, temporarily held, user-paused, auto-playing, reduced-motion.
- `ViewTab`: inactive, active, keyboard-focused, progress-running, progress-paused.
- `DiagramPanel`: hidden, active-entering, settled; Architecture is visible without JavaScript.
- `PlaybackControl`: hidden before enhancement, Pause while auto-play is enabled, Play while explicitly paused.
- `EvidenceLegend`: verified, assumption, current, proposed; always present across renderer views.

## 6. Motion
Panels enter with opacity and an 8px vertical transform using the existing ease-out character. Nodes resolve in reading order at 55ms intervals. Edges trace once after their source nodes. The selected tab carries one 5-second progress line only while the timer is active. Temporary holds stop and restart the cycle; they do not add decorative motion.

## 7. Accessibility Constraints
Use the WAI-ARIA tabs pattern with roving tabindex, `aria-controls`, `aria-labelledby`, Left/Right/Home/End keys, and visible focus. Automatic changes have an adjacent pause control and stop on hover, focus within the workbench, document hiding, or reduced-motion preference. Color never carries evidence meaning alone.

## 8. Accepted Debt and Handoff
The marketing preview uses representative compact SVG rather than loading full renderer output to keep GitHub Pages dependency-free. This is accepted only while every panel remains truthful to a supported renderer and its engineering question. Recheck all eight panels whenever the public renderer catalog changes.
```

- [ ] **Step 2: Require the design contract in repository validation**

Add `DESIGN.md` to the existing required-path array in `scripts/validate-repo.mjs`:

```js
for (const relativePath of [
  'DESIGN.md',
  'vendor/archify/bin/archify.mjs',
]) {
  check(fs.existsSync(fromRoot(relativePath)), `${relativePath} is required.`);
}
```

- [ ] **Step 3: Verify the contract is recognized**

Run: `npm run validate && git diff --check`

Expected: repository validation prints its success line and Git reports no whitespace errors.

- [ ] **Step 4: Commit the design contract**

```bash
git add DESIGN.md scripts/validate-repo.mjs
git commit -m "Document the Diago web design system"
```

---

### Task 2: Build the Eight-View Semantic Contract and Preview Controller

**Files:**
- Create: `test/github-pages-preview.test.mjs`
- Modify: `docs/index.html:49,104-229`
- Modify: `docs/app.js:1-86`

**Interfaces:**
- Consumes: the view order, filenames, questions, playback rules, and primitive states defined in the approved spec and `DESIGN.md`.
- Produces: `HERO_VIEWS`, `nextDiagramIndex`, `diagramIndexForKey`, `shouldAutoPlay`, and `createDiagramPreview`; eight tab/panel pairs keyed by renderer ID.

- [ ] **Step 1: Write failing contract and state tests**

Create `test/github-pages-preview.test.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fromRoot } from '../lib/paths.mjs';
import {
  HERO_VIEWS,
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
```

- [ ] **Step 2: Run the focused test and confirm the old preview fails**

Run: `node --test test/github-pages-preview.test.mjs`

Expected: FAIL because `docs/app.js` is not import-safe and the HTML still exposes Architecture, Sequence, and Evidence.

- [ ] **Step 3: Export deterministic view metadata and state helpers**

At the top of `docs/app.js`, define the public metadata and pure helpers exactly once:

```js
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
```

Move all existing `document` queries and listener registration into `initializeSite(documentRoot = document)`. End the file with an environment guard so Node can import the helpers:

```js
if (typeof document !== 'undefined') {
  initializeSite(document);
}
```

- [ ] **Step 4: Implement the preview controller without adding a dependency**

Implement and export `createDiagramPreview(root, environment = globalThis)` in `docs/app.js` with this state contract:

```js
export function createDiagramPreview(root, environment = globalThis) {
  const tabs = [...root.querySelectorAll('[data-diagram-view]')];
  const panels = [...root.querySelectorAll('[data-view-panel]')];
  const title = root.querySelector('[data-preview-title]');
  const toggle = root.querySelector('[data-preview-toggle]');
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
```

Inside `initializeSite`, call `createDiagramPreview` for each `[data-diagram-preview]` root before wiring the existing install, copy, and navigation controls. Do not add a global autoplay listener outside `createDiagramPreview`.

- [ ] **Step 5: Replace the three tabs with the exact eight-tab WAI-ARIA contract**

Change the page script to `<script type="module" src="./app.js"></script>`. Add `data-diagram-preview` to `.workbench`, `data-preview-title` to the filename, and a hidden text playback button after the filename:

```html
<button class="preview-toggle" type="button" data-preview-toggle hidden>Pause</button>
```

Create buttons in the approved order. Each follows this complete pattern, with only the IDs, key, label, and selected/tabindex state changed:

```html
<button id="preview-tab-architecture" type="button" role="tab" aria-selected="true" aria-controls="preview-panel-architecture" tabindex="0" data-diagram-view="architecture">Architecture</button>
<button id="preview-tab-sequence" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-sequence" tabindex="-1" data-diagram-view="sequence">Sequence</button>
<button id="preview-tab-workflow" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-workflow" tabindex="-1" data-diagram-view="workflow">Workflow</button>
<button id="preview-tab-dataflow" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-dataflow" tabindex="-1" data-diagram-view="dataflow">Dataflow</button>
<button id="preview-tab-lifecycle" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-lifecycle" tabindex="-1" data-diagram-view="lifecycle">Lifecycle</button>
<button id="preview-tab-data-model" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-data-model" tabindex="-1" data-diagram-view="data-model">Data model</button>
<button id="preview-tab-timeline" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-timeline" tabindex="-1" data-diagram-view="timeline">Timeline</button>
<button id="preview-tab-layers" type="button" role="tab" aria-selected="false" aria-controls="preview-panel-layers" tabindex="-1" data-diagram-view="layers">Layers</button>
```

- [ ] **Step 6: Build eight truthful compact panels**

Keep Architecture and Sequence, add `role="tabpanel"`, panel IDs, tab labels, and animation hooks. Remove the Evidence panel. Add the other six SVGs using `viewBox="0 0 760 420"`, unique marker/gradient IDs, a `<title>`, and these exact visual/content contracts:

| Panel | Nodes or tracks | Current path | Proposed, failure, or gap path |
|---|---|---|---|
| Workflow | Author: Draft migration; CI: Backup verified and Read checks; Database: Shadow schema; Operator: Promote | Draft → Backup verified → Shadow schema → Read checks → Promote | Failed read checks → Rollback |
| Dataflow | Gateway; Normalizer; Event bus; Ledger; Warehouse | Gateway → Normalizer → Event bus → Ledger | Event bus → Warehouse; label the normalized payload as tokenized |
| Lifecycle | Created; Authorized; Captured; Settled; Failed; Refunded | Created → Authorized → Captured → Settled | Authorization/Capture → Failed; Captured/Settled → Refunded |
| Data model | Order; PaymentAttempt; IdempotencyKey; Refund | Order 1:N PaymentAttempt; PaymentAttempt N:1 IdempotencyKey | PaymentAttempt 1:0..N Refund |
| Timeline | Application track; Data track; Operations track | Dual write → Backfill → Read switch → Cleanup | Rollback checkpoint before Read switch; assumption marker on cleanup date |
| Layers | Interface; Application; Domain; Infrastructure; Observability and policy cross-cut | Interface → Application → Domain → Infrastructure | Authorization gap on Application; proposed policy enforcement across all layers |

Use these fixed geometry anchors so each panel remains legible at the existing stage size:

```text
Workflow lane centers: y=64, 154, 244, 334; node x centers: 92, 230, 374, 520, 660.
Dataflow stage x positions: 34, 175, 316, 457, 598; each stage is 122px wide.
Lifecycle top-row x centers: 96, 286, 476, 664 at y=112; Failed at (286, 300); Refunded at (570, 300).
Data model boxes: Order (42,72,170,122); PaymentAttempt (294,52,178,142); IdempotencyKey (548,72,170,122); Refund (294,256,178,108).
Timeline milestone x positions: 105, 278, 451, 624; track centers: y=92, 210, 328.
Layers: cross-cut bar (40,48,66,304); layer boxes x=142, width=538, height=58, y=48,126,204,282.
```

Every panel must contain at least one `data-animate-node` and one `data-animate-edge`. Use `style="--reveal-index: N"` with consecutive integers beginning at zero; do not encode timing values in markup.

- [ ] **Step 7: Run the focused and full functional suites**

Run: `node --check docs/app.js && node --test test/github-pages-preview.test.mjs && npm test`

Expected: the focused file passes all three tests and the full suite passes with the new file included.

- [ ] **Step 8: Commit the semantic preview behavior**

```bash
git add docs/index.html docs/app.js test/github-pages-preview.test.mjs
git commit -m "Add the eight-view hero preview"
```

---

### Task 3: Apply Responsive Geometry, Meaningful Motion, and Reduced-Motion Safety

**Files:**
- Modify: `docs/styles.css:1-21,323-675,1399-1403,1425-1531,1657-1668`
- Modify: `test/github-pages-preview.test.mjs`

**Interfaces:**
- Consumes: `data-preview-running`, `.is-progressing`, `.is-active`, `data-animate-node`, `data-animate-edge`, and `--reveal-index` from Task 2.
- Produces: the 4 by 2 desktop/tablet switcher, mobile tab rail, panel primitive styles, one-shot progress/reveal/trace animation, and static reduced-motion state.

- [ ] **Step 1: Extend the focused test with CSS contract checks**

Append this test:

```js
const css = fs.readFileSync(fromRoot('docs', 'styles.css'), 'utf8');

test('preview CSS defines eight-view geometry, playback progress, and reduced-motion safety', () => {
  assert.match(css, /\.view-switcher\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.view-switcher\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.match(css, /\[data-preview-running="true"\]/);
  assert.match(css, /@keyframes preview-progress/);
  assert.match(css, /@keyframes preview-panel-in/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.diagram-view/s);
});
```

- [ ] **Step 2: Run the focused test and confirm the CSS contract fails**

Run: `node --test test/github-pages-preview.test.mjs`

Expected: FAIL because `.view-switcher` is still flex-based and the preview-specific keyframes do not exist.

- [ ] **Step 3: Add the named preview tokens and separate the install tabs from the view switcher**

Add these variables to `:root`:

```css
--preview-cycle: 5000ms;
--preview-enter: 260ms;
--preview-resolve: 320ms;
--preview-trace: 420ms;
--preview-stagger: 55ms;
--preview-ease: cubic-bezier(0.22, 1, 0.36, 1);
--preview-lift: 8px;
--line-strong: #34465a;
--surface-verified: #142a28;
--line-verified: rgba(110, 243, 197, 0.66);
--line-structure: rgba(108, 168, 255, 0.34);
--line-risk: rgba(255, 127, 159, 0.62);
```

Replace the shared `.view-switcher, .install-tabs` layout rule with separate rules. The preview uses:

```css
.view-switcher {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid var(--line-soft);
}

.install-tabs {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--line-soft);
}
```

- [ ] **Step 4: Style playback, progress, and panel primitives**

Implement these state rules, then add panel-specific classes for workflow lanes, dataflow stages, lifecycle states, entity boxes, timeline tracks, and architecture layers using existing tokens only:

```css
.preview-toggle {
  flex: 0 0 auto;
  margin-inline: 10px;
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--muted-strong);
  cursor: pointer;
  font: 700 0.58rem/1 var(--mono);
}

.view-switcher button {
  position: relative;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.view-switcher button::after {
  position: absolute;
  right: 8px;
  bottom: 2px;
  left: 8px;
  height: 1px;
  content: "";
  background: var(--mint);
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left;
}

[data-preview-running="true"] .view-switcher button.is-progressing::after {
  opacity: 0.9;
  animation: preview-progress var(--preview-cycle) linear both;
}

.diagram-view.is-active {
  display: block;
  animation: preview-panel-in var(--preview-enter) var(--preview-ease) both;
}

.diagram-view.is-active [data-animate-node] {
  animation: preview-resolve var(--preview-resolve) var(--preview-ease) both;
  animation-delay: calc(var(--reveal-index) * var(--preview-stagger));
}

.diagram-view.is-active [data-animate-edge] {
  animation: preview-trace var(--preview-trace) var(--preview-ease) both;
  animation-delay: calc(var(--reveal-index) * var(--preview-stagger));
}
```

Replace the current infinite `.flow-lines path` animation with the same one-shot `preview-trace` contract.

Use the following shared SVG class contract for the six new renderers; panel-specific geometry stays in the SVG attributes defined in Task 2:

```css
.preview-lane,
.preview-track-line {
  fill: none;
  stroke: rgba(145, 162, 181, 0.22);
  stroke-dasharray: 4 6;
}

.preview-card rect,
.preview-state rect,
.preview-entity rect,
.preview-layer rect {
  fill: var(--surface);
  stroke: var(--line-strong);
}

.preview-card.is-verified rect,
.preview-state.is-verified rect,
.preview-layer.is-verified rect {
  fill: var(--surface-verified);
  stroke: var(--line-verified);
}

.preview-card.is-risk rect,
.preview-state.is-risk rect {
  stroke: var(--line-risk);
}

.preview-label {
  fill: var(--text);
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 720;
}

.preview-meta,
.preview-edge-label,
.preview-cardinality {
  fill: var(--muted);
  font-family: var(--mono);
  font-size: 8.5px;
}

.preview-edge {
  fill: none;
  stroke: var(--blue);
  stroke-width: 1.7;
}

.preview-edge.is-proposed {
  stroke: var(--mint);
  stroke-dasharray: 4 5;
}

.preview-edge.is-risk {
  stroke: var(--rose);
  stroke-dasharray: 3 5;
}

.preview-assumption {
  fill: var(--yellow);
  font-family: var(--mono);
  font-size: 8px;
}

.preview-crosscut {
  fill: color-mix(in srgb, var(--blue) 7%, transparent);
  stroke: var(--line-structure);
  stroke-dasharray: 4 5;
}
```

- [ ] **Step 5: Add the four keyframes without animating layout**

```css
@keyframes preview-progress {
  to { transform: scaleX(1); }
}

@keyframes preview-panel-in {
  from { opacity: 0; transform: translateY(var(--preview-lift)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes preview-resolve {
  from { opacity: 0; transform: translateY(calc(var(--preview-lift) * 0.625)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes preview-trace {
  from { opacity: 0; stroke-dashoffset: 48; }
  to { opacity: 1; stroke-dashoffset: 0; }
}
```

- [ ] **Step 6: Add the mobile tab rail and reduced-motion override**

Inside `@media (max-width: 760px)`:

```css
.view-switcher {
  display: flex;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.view-switcher::-webkit-scrollbar { display: none; }
.view-switcher button { flex: 0 0 auto; min-width: max-content; scroll-snap-align: start; }
.workbench-title { max-width: 150px; }
.preview-toggle { margin-inline: 6px; }
```

Inside the existing reduced-motion block, make every panel and child settle immediately and suppress progress:

```css
.diagram-view,
.diagram-view [data-animate-node],
.diagram-view [data-animate-edge],
.view-switcher button::after {
  animation: none !important;
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 7: Run CSS, syntax, repository, and full tests**

Run: `node --test test/github-pages-preview.test.mjs && node --check docs/app.js && npm run check && git diff --check`

Expected: the focused preview tests, repository validation, all Node tests, JavaScript syntax, and whitespace checks pass.

- [ ] **Step 8: Commit the responsive visual system**

```bash
git add docs/styles.css test/github-pages-preview.test.mjs
git commit -m "Animate the responsive hero workbench"
```

---

### Task 4: Exercise Every Interaction and Complete Dual-Oracle Visual QA

**Files:**
- Modify only if QA finds a defect: `docs/index.html`, `docs/app.js`, `docs/styles.css`, `test/github-pages-preview.test.mjs`, `DESIGN.md`
- Create outside repository: `/tmp/diago-eight-view-qa/`

**Interfaces:**
- Consumes: the complete preview implementation and the visual/accessibility contract.
- Produces: fresh evidence for all eight panels at three breakpoints, interaction-state evidence, reduced-motion evidence, and two independent PASS verdicts.

- [ ] **Step 1: Run the complete pre-browser gate**

Run: `npm run check && node --check docs/app.js && git diff --check && git status --short`

Expected: validation and tests pass, JavaScript parses, no whitespace errors exist, and only intended feature files are changed.

- [ ] **Step 2: Serve the production-static site**

Run from the repository root: `python3 -m http.server 4173 --directory docs`

Expected: `http://127.0.0.1:4173/` returns the Diago page and local assets without console errors.

- [ ] **Step 3: Drive the complete interaction matrix in a real Chromium browser**

At 1280px, verify:

1. The tabs form four equal columns and two rows.
2. Architecture auto-advances to Sequence after five seconds and the filename changes.
3. Pause holds the current view for more than five seconds; Play resumes after temporary pointer/focus holds clear.
4. Hover, tab focus, and a hidden document each prevent advancement independently.
5. Right/Left wrap between Architecture and Layers; Home and End select the endpoints and retain focus.
6. Every tab selects the matching panel and filename.

At 768px, repeat all eight manual selections and confirm the 4 by 2 grid remains visible. At 375px, select Architecture, Lifecycle, and Layers and confirm the tab rail scrolls only within the workbench with no page-level horizontal overflow.

- [ ] **Step 4: Capture the required fresh evidence set**

Write PNGs under `/tmp/diago-eight-view-qa/` with these names:

```text
1280-architecture.png
1280-sequence.png
1280-workflow.png
1280-dataflow.png
1280-lifecycle.png
1280-data-model.png
1280-timeline.png
1280-layers.png
768-grid.png
375-architecture-rail-start.png
375-lifecycle-rail-middle.png
375-layers-rail-end.png
1280-paused.png
1280-reduced-motion.png
```

Each capture must include the title bar, complete tablist, full diagram stage, and evidence footer. Record `document.documentElement.scrollWidth === document.documentElement.clientWidth` at every viewport.

- [ ] **Step 5: Run the mandatory independent review passes**

Run `/visual-qa` with the full fresh evidence set and source paths. Pass A reviews design-system/functional integrity; Pass B reviews visual fidelity, responsive quality, typography, interaction states, and reduced-motion behavior. Both reviewers must return PASS on the same revision. Fix every blocker and recapture affected states before asking reviewers again.

- [ ] **Step 6: Re-run the full gate after the final visual fix**

Run: `npm run check && node --check docs/app.js && git diff --check`

Expected: all checks pass after the exact revision represented by the final screenshots.

- [ ] **Step 7: Commit only if QA required corrections**

```bash
git add DESIGN.md docs/index.html docs/app.js docs/styles.css test/github-pages-preview.test.mjs
git commit -m "Polish the eight-view hero preview"
```

Skip this commit when the working tree has no QA corrections.

---

### Task 5: Integrate, Deploy, and Verify GitHub Pages

**Files:**
- No additional source files unless deployment validation exposes a reproducible product defect.

**Interfaces:**
- Consumes: a green feature branch with dual-oracle visual-QA approval.
- Produces: `main` containing the eight-view workbench without temporary implementation documents, successful CI and Pages runs, a clean local branch set, and a live verified page.

- [ ] **Step 1: Remove completed specifications, plans, phases, and roadmap artifacts**

Use `apply_patch` to delete these four temporary working files after every implementation and QA task has passed:

```text
docs/superpowers/specs/2026-08-13-software-engineering-diagram-expansion-design.md
docs/superpowers/plans/2026-08-13-software-engineering-diagram-expansion.md
docs/superpowers/specs/2026-08-13-animated-hero-preview-design.md
docs/superpowers/plans/2026-08-13-eight-view-animated-hero-preview.md
```

The first three files are tracked and must appear as deletions. The current plan may still be untracked; deleting it must leave no staged or untracked copy. Empty `docs/superpowers/plans` and `docs/superpowers/specs` directories disappear automatically because Git does not track directories.

Run: `find docs/superpowers -type f -print 2>/dev/null || true`

Expected: no output. Do not delete `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, renderer documentation, product information, or usage examples.

- [ ] **Step 2: Commit the documentation cleanup**

```bash
git add -u docs/superpowers
git commit -m "Remove completed implementation notes"
```

- [ ] **Step 3: Verify the branch tip one final time**

Run: `npm run check && git status --short --branch && git log --oneline --decorate -8`

Expected: all checks pass; the working tree is clean; the current tree contains the design contract, preview implementation, tests, retained project documentation, and no temporary implementation documents.

- [ ] **Step 4: Merge the feature branch into current `main` without rewriting history**

```bash
git fetch --prune origin
git switch main
git pull --ff-only origin main
git merge --no-ff feature/eight-view-hero-preview -m "Merge eight-view animated hero preview"
```

- [ ] **Step 5: Verify the merged result before publishing**

Run: `npm run check && node --check docs/app.js && git diff --check origin/main...HEAD`

Expected: every check passes on the exact merge commit and the diff contains no unrelated path.

- [ ] **Step 6: Push `main` and verify the remote head**

```bash
git push origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Expected: the two SHAs are identical.

- [ ] **Step 7: Wait for CI and GitHub Pages to succeed**

Use `gh run list --branch main --limit 6` to identify the CI and Deploy GitHub Pages runs for the merge SHA, then watch both with `gh run watch <run-id> --exit-status`.

Expected: both workflows complete with `success` for the merge SHA.

- [ ] **Step 8: Verify the deployed page and clean the merged branch**

Open `https://amirtaherkhani.github.io/diago/` in a fresh browser context. Confirm eight renderer tabs, no Evidence tab, Architecture default, successful manual selection of Layers, the correct Layers filename, and no console or horizontal-overflow errors. Then run:

```bash
git branch -d feature/eight-view-hero-preview
git status --short --branch
```

Expected: the local feature branch is removed and `main` is clean and synchronized with `origin/main`.
