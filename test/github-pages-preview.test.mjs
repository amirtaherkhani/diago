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
const css = fs.readFileSync(fromRoot('docs', 'styles.css'), 'utf8');
const design = fs.readFileSync(fromRoot('DESIGN.md'), 'utf8');
const previewStart = html.indexOf('data-diagram-preview');
const previewMarkup = html.slice(previewStart, html.indexOf('</section>', previewStart));
test('every root design token and local motion input is documented', () => {
  const rootTokens = [...css.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]);

  for (const token of rootTokens) assert.match(design, new RegExp('`' + token + '`'));
  assert.match(design, /`--reveal-index`/);
});

test('preview markup contains no raw paint literals', () => {
  assert.doesNotMatch(previewMarkup, /#[0-9a-f]{3,8}\b|rgba?\(/i);
});

test('rendered site paint is declared only in the root token layer', () => {
  const componentCss = css.replace(/:root\s*\{[\s\S]*?\n\}/, '');

  assert.doesNotMatch(componentCss, /#[0-9a-f]{3,8}\b|rgba?\(/i);
});

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
  assert.match(html, /data-preview-toggle[^>]*hidden/);
  assert.match(html, /data-diagram-stage/);
  assert.match(html, /role="tablist"/);
  for (const view of expectedViews) {
    assert.match(html, new RegExp(`id="preview-tab-${view}"[^>]+aria-controls="preview-panel-${view}"`));
    assert.match(html, new RegExp(`id="preview-panel-${view}"[^>]+role="tabpanel"[^>]+aria-labelledby="preview-tab-${view}"`));
  }
  assert.match(html, /id="preview-panel-architecture"(?![^>]*hidden)/);
  for (const view of expectedViews.slice(1)) {
    assert.match(html, new RegExp(`id="preview-panel-${view}"[^>]*hidden`));
  }
});
