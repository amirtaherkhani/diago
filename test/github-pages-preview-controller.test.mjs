import assert from 'node:assert/strict';
import test from 'node:test';
import { HERO_VIEWS } from '../docs/app.js';
import { FakeEventTarget, createPreviewFixture } from './github-pages-preview-fixture.mjs';

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

test('controller schedules playback and wraps after the final view', () => {
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
    { reason: 'focus', hold: () => fixture.root.dispatch('focusin'), release: () => fixture.root.dispatch('focusout', { relatedTarget: new FakeEventTarget() }) },
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
