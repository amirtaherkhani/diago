# Software Engineering Diagram Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Diago from five to eight deterministic software-engineering diagram types with evidence-aware selection, schema-v2 planning, stdio MCP and CLI support, documentation, provenance, and a locally installable release.

**Architecture:** Add an engine-neutral catalog and renderer registry in front of the existing Archify adapter. Keep the five existing renderers vendored and unchanged, while three focused Diago-owned renderers consume strict JSON IR and emit accessible standalone HTML. Normalize legacy plan-v1 inputs at the review boundary and generate only plan-v2 outputs.

**Tech Stack:** Node.js 18+ ESM, built-in `node:test`, JSON Schema artifacts, standard stdio MCP, deterministic SVG/HTML, static GitHub Pages.

## Global Constraints

- Diago remains a software-engineering visualization toolkit, not a general-purpose chart studio.
- Native renderer names are exactly `architecture`, `sequence`, `workflow`, `dataflow`, `lifecycle`, `data-model`, `timeline`, and `layers`.
- Existing v1 plans remain accepted through the pre-1.0 release line; newly generated plans use schema v2 only.
- Existing architecture, sequence, workflow, dataflow, and lifecycle rendering delegates to the bundled Archify runtime.
- Diago-owned renderers live outside `vendor/` and never patch upstream snapshots.
- The standard local stdio MCP package remains the only supported transport.
- Public artifacts exclude credentials, customer data, private hostnames, and local absolute paths.
- All renderer output is deterministic, standalone, accessible, responsive, and evidence-honest.
- Default balanced budgets are 12/16 architecture, 6/16 sequence, 5 lanes/12 steps/16 edges workflow, 6 stages/12 nodes/16 flows dataflow, 12/16 lifecycle, 8/12 data model, 12 milestones/4 tracks timeline, and 7 layers/24 items layers.
- The release version is `0.3.0`, preserving compatibility with `0.2.0` while adding new capability.

---

## File Structure

- `lib/diagram-catalog.mjs`: immutable renderer metadata, profiles, semantic patterns, budgets, and support status.
- `lib/recommender.mjs`: deterministic question/pattern/profile selection from a task and optional context.
- `lib/planner.mjs`: schema-v2 plan construction.
- `lib/plan-compat.mjs`: v1-to-v2 normalization without rewriting user files.
- `lib/reviewer.mjs`: plan-v1/v2 review, renderer/profile fit, complexity, fidelity, and evidence checks.
- `lib/renderer-registry.mjs`: common validation/render dispatch for Archify-backed and Diago-owned engines.
- `lib/renderers/shared.mjs`: escaping, geometry primitives, diagnostics, and accessible HTML document shell.
- `lib/renderers/data-model.mjs`: entity/cardinality validation and layout.
- `lib/renderers/timeline.mjs`: track/milestone validation and layout.
- `lib/renderers/layers.mjs`: layer/dependency/control validation and layout.
- `mcp/contracts.mjs`: MCP schemas and six public tool definitions.
- `mcp/input.mjs`: closed-world MCP argument parsing and limits.
- `mcp/artifacts.mjs`: output-root and overwrite policy.
- `mcp/tools.mjs`: small tool dispatcher using catalog, planner, reviewer, and registry.
- `schemas/*.schema.json`: advice v2, plan v2, and the three new renderer IR contracts.
- `examples/*`: one valid artifact source for every new renderer plus prompt/project/conversation plans.
- `test/catalog.test.mjs`: catalog and selector unit behavior.
- `test/plans.test.mjs`: v2 generation and v1 compatibility behavior.
- `test/renderers.test.mjs`: new renderer validation, geometry, accessibility, and determinism.
- `test/mcp.test.mjs`, `test/cli.test.mjs`: public integration and end-to-end contracts.
- `skills/*/SKILL.md`: question-first selection, catalog discovery, fidelity, and conversation reconciliation.
- `README.md`, `docs/index.html`, `docs/app.js`: verified eight-view and six-tool public documentation.
- `vendor/diagram-design/`: separated MIT license and minimal methodology snapshot.
- `vendor/upstreams.lock.json`, sync scripts/workflow, `THIRD_PARTY_NOTICES.md`: pinned provenance and updates.

---

### Task 1: Renderer catalog and deterministic engineering selection

**Files:**
- Create: `lib/diagram-catalog.mjs`
- Modify: `knowledge/diagram-recipes.json`
- Modify: `lib/recommender.mjs`
- Modify: `schemas/advice.schema.json`
- Create: `test/catalog.test.mjs`

**Interfaces:**
- Produces: `DIAGRAM_TYPES`, `listDiagramTypes()`, `getDiagramType(type)`, `getProfile(type, profile)`, and `advise(task, context)`.
- `advise` context keys are `sourceKind`, `audienceDetail`, and `destination`; output uses `schemaVersion: 2`.

- [ ] **Step 1: Write failing catalog and routing tests**

```js
test('lists only eight enabled native engineering renderers', () => {
  const catalog = listDiagramTypes();
  assert.deepEqual(catalog.map(({ type }) => type), [
    'architecture', 'sequence', 'workflow', 'dataflow', 'lifecycle',
    'data-model', 'timeline', 'layers',
  ]);
  assert.ok(catalog.every(({ supported }) => supported));
});

test('selects model, timeline, and layers from engineering questions', () => {
  assert.equal(advise('Show database entities and foreign-key cardinality').recommendation.type, 'data-model');
  assert.equal(advise('Build a migration milestone timeline').recommendation.type, 'timeline');
  assert.equal(advise('Show application layers and control enforcement').recommendation.type, 'layers');
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test test/catalog.test.mjs`

Expected: failure because `lib/diagram-catalog.mjs` does not exist and the new routes are unavailable.

- [ ] **Step 3: Implement the immutable catalog and enriched recipes**

Each catalog entry must contain `type`, `question`, `profiles`, `semanticPatterns`, `budget`, `engine`, `supported`, `appropriate`, and `inappropriate`. Add recipe fields `profile` and `semanticPattern`; score exact multi-word signals above individual tokens and retain lexical-id tie-breaking.

- [ ] **Step 4: Emit advice schema v2**

The result must contain `recommendation.pattern`, `recommendation.profile`, `recommendation.rationale`, `recommendation.budget`, and `recommendation.decomposition`, plus context fields under `source`, `audience`, and `destination`. Alternatives must refer only to catalog entries with `supported: true`.

- [ ] **Step 5: Run focused and existing core tests**

Run: `node --test test/catalog.test.mjs test/core.test.mjs`

Expected: all catalog and existing routing tests pass.

- [ ] **Step 6: Commit the selection foundation**

```bash
git add lib/diagram-catalog.mjs lib/recommender.mjs knowledge/diagram-recipes.json schemas/advice.schema.json test/catalog.test.mjs test/core.test.mjs
git commit -m "Add engineering diagram catalog"
```

### Task 2: Diagram plan v2 and legacy compatibility

**Files:**
- Create: `lib/plan-compat.mjs`
- Modify: `lib/planner.mjs`
- Modify: `lib/reviewer.mjs`
- Modify: `schemas/diagram-plan.schema.json`
- Create: `schemas/diagram-plan-v1.schema.json`
- Modify: `examples/checkout-feature.diagram-plan.json`
- Create: `test/fixtures/legacy-plan-v1.json`
- Create: `test/plans.test.mjs`

**Interfaces:**
- Produces: `createPlan(task, context)`, `normalizePlan(plan)`, and `reviewPlan(plan)`.
- Normalized plans always contain schema-v2 `source`, `audience`, `selection`, `complexity`, `fidelity`, `superseded`, and enriched `views` fields.

- [ ] **Step 1: Write failing v2 generation and v1 normalization tests**

```js
test('creates a schema-v2 plan with selection and fidelity contracts', () => {
  const plan = createPlan('Map domain entities and foreign keys', {
    sourceKind: 'repository', audienceDetail: 'technical', destination: 'architecture-review',
  });
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.selection.renderer, 'data-model');
  assert.equal(plan.views[0].profile, plan.selection.profile);
  assert.deepEqual(plan.fidelity, { merged: [], collapsed: [], omitted: [], preserved: [] });
});

test('reviews a legacy plan through compatibility normalization', () => {
  const result = reviewPlan(readFixture('legacy-plan-v1.json'));
  assert.equal(result.ok, true);
  assert.ok(result.findings.some(({ code }) => code === 'schema-v1-compat'));
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `node --test test/plans.test.mjs`

Expected: schema version and normalization assertions fail against current plan-v1 code.

- [ ] **Step 3: Implement plan-v1 normalization and v2 creation**

Legacy views receive the catalog default profile and `role: "primary"`; legacy audience text becomes `audience.role`; missing source becomes a prompt-scoped legacy label. The original object is never mutated.

- [ ] **Step 4: Extend review for fit, complexity, fidelity, and safe evidence**

Reject unknown renderers, renderer/profile mismatch, multiple primary views, missing questions, invalid budgets, and absent fidelity entries when decomposition is not `single`. Flag local absolute paths and secret-like evidence labels as blockers. Report `schema-v1-compat` as a migration finding without making an otherwise valid v1 plan fail.

- [ ] **Step 5: Run plan and core tests**

Run: `node --test test/plans.test.mjs test/core.test.mjs`

Expected: v2 examples score 100, valid v1 remains accepted with a migration finding, invalid profiles and evidence fail.

- [ ] **Step 6: Commit plan compatibility**

```bash
git add lib/plan-compat.mjs lib/planner.mjs lib/reviewer.mjs schemas/diagram-plan.schema.json schemas/diagram-plan-v1.schema.json examples/checkout-feature.diagram-plan.json test/fixtures/legacy-plan-v1.json test/plans.test.mjs test/core.test.mjs
git commit -m "Add diagram plan schema v2"
```

### Task 3: Engine-neutral registry, CLI, and six-tool MCP surface

**Files:**
- Create: `lib/renderer-registry.mjs`
- Create: `mcp/contracts.mjs`
- Create: `mcp/input.mjs`
- Create: `mcp/artifacts.mjs`
- Modify: `mcp/tools.mjs`
- Modify: `mcp/protocol.mjs`
- Modify: `bin/diago.mjs`
- Modify: `test/mcp.test.mjs`
- Modify: `test/cli.test.mjs`

**Interfaces:**
- Produces: `validateDiagramDocument({ type, diagram, quality })`, `renderDiagramDocument({ type, diagram, outputPath, quality })`, and MCP `list_diagram_types`.
- Existing Archify-backed behavior and output-root protection remain observable-compatible.

- [ ] **Step 1: Write failing registry, MCP-list, and CLI-type tests**

```js
test('MCP exposes six tools and a deterministic type catalog', () => {
  assert.equal(TOOL_DEFINITIONS.length, 6);
  const result = callTool('list_diagram_types', {});
  assert.deepEqual(result.structuredContent.types.map(({ type }) => type), DIAGRAM_TYPES);
});

test('CLI lists all native types as JSON', () => {
  const result = run(['types', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).types.length, 8);
});
```

- [ ] **Step 2: Run MCP and CLI tests and confirm RED**

Run: `node --test test/mcp.test.mjs test/cli.test.mjs`

Expected: tool count and `types` command fail.

- [ ] **Step 3: Introduce registry dispatch for existing renderers**

Move temporary-file Archify validation and delivery behind the registry. Preserve `<inline-diagram>` sanitization and the existing validation and delivery receipt shapes.

- [ ] **Step 4: Split MCP responsibilities and add context arguments**

`advise_diagram` and `create_diagram_plan` accept closed-world optional `sourceKind`, `audienceDetail`, and `destination`. `list_diagram_types` accepts no arguments. `validate_diagram` and `render_diagram` use all eight catalog enums and call the registry.

- [ ] **Step 5: Add CLI `types` and context options**

Support `diago types [--json]` and `--source prompt|repository|conversation|mixed`, `--audience technical|mixed|executive`, and `--destination <label>` for `advise` and `plan`. Reject unknown options with exit code 2.

- [ ] **Step 6: Run integration tests**

Run: `node --test test/mcp.test.mjs test/cli.test.mjs`

Expected: six tools, eight types, context parsing, existing Archify validate/render, overwrite, output root, and stdio negotiation pass.

- [ ] **Step 7: Commit the registry and public surfaces**

```bash
git add lib/renderer-registry.mjs mcp/contracts.mjs mcp/input.mjs mcp/artifacts.mjs mcp/tools.mjs mcp/protocol.mjs bin/diago.mjs test/mcp.test.mjs test/cli.test.mjs
git commit -m "Route tools through renderer registry"
```

### Task 4: Native data-model renderer

**Files:**
- Create: `schemas/data-model.schema.json`
- Create: `lib/renderers/shared.mjs`
- Create: `lib/renderers/data-model.mjs`
- Create: `examples/order-domain.data-model.json`
- Create: `test/renderers.test.mjs`
- Modify: `lib/renderer-registry.mjs`

**Interfaces:**
- Data-model IR contains `entities[].fields[]` and `relationships[]` with explicit endpoints and cardinalities.
- Renderer returns one accessible SVG inside a standalone HTML document and a standard registry receipt.

- [ ] **Step 1: Write failing validation and rendering tests**

```js
test('data-model validates endpoints and renders cardinality', () => {
  const diagram = readExample('order-domain.data-model.json');
  assert.equal(validateDiagramDocument({ type: 'data-model', diagram }).ok, true);
  const html = renderToTemporaryHtml('data-model', diagram);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-labelledby=/);
  assert.match(html, /1\.\.\*/);
});

test('data-model rejects an unknown relationship endpoint', () => {
  const diagram = { ...readExample('order-domain.data-model.json'), relationships: [{ from: 'missing', to: 'order', fromCardinality: 'one', toCardinality: 'many' }] };
  assert.throws(() => validateDiagramDocument({ type: 'data-model', diagram }), /unknown endpoint/i);
});
```

- [ ] **Step 2: Run the renderer test and confirm RED**

Run: `node --test --test-name-pattern=data-model test/renderers.test.mjs`

Expected: failure because the data-model adapter and schema do not exist.

- [ ] **Step 3: Implement strict validation and deterministic entity layout**

Require unique IDs, at least one field per entity, recognized key/status/cardinality values, valid relationship endpoints, at most eight entities and twelve relationships, and no invented defaults for missing cardinality.

- [ ] **Step 4: Implement accessible standalone HTML**

Escape every label; include `<title>` and `<desc>`; give entity groups `tabindex="0"`; keep legend outside the SVG geometry; use a responsive `viewBox`; include visible focus and `prefers-reduced-motion` CSS.

- [ ] **Step 5: Run data-model and deterministic-output tests**

Run: `node --test --test-name-pattern=data-model test/renderers.test.mjs`

Expected: validation, invalid endpoint, accessibility, and byte-identical repeat rendering pass.

- [ ] **Step 6: Commit the data-model renderer**

```bash
git add schemas/data-model.schema.json lib/renderers/shared.mjs lib/renderers/data-model.mjs lib/renderer-registry.mjs examples/order-domain.data-model.json test/renderers.test.mjs
git commit -m "Add native data model renderer"
```

### Task 5: Native engineering timeline renderer

**Files:**
- Create: `schemas/timeline.schema.json`
- Create: `lib/renderers/timeline.mjs`
- Create: `examples/payment-migration.timeline.json`
- Modify: `lib/renderer-registry.mjs`
- Modify: `test/renderers.test.mjs`

**Interfaces:**
- Timeline IR contains up to four `tracks` and twelve ordered `milestones` with an integer `position`, status, and either an exact date or an evidence-honest phase label.

- [ ] **Step 1: Write failing timeline tests**

```js
test('timeline renders ordered phased milestones on bounded tracks', () => {
  const diagram = readExample('payment-migration.timeline.json');
  const validation = validateDiagramDocument({ type: 'timeline', diagram });
  assert.equal(validation.ok, true);
  const html = renderToTemporaryHtml('timeline', diagram);
  assert.ok(html.indexOf('Shadow write') < html.indexOf('Cut over'));
});

test('timeline rejects milestones without a known track or temporal label', () => {
  const diagram = readExample('payment-migration.timeline.json');
  diagram.milestones[0] = { ...diagram.milestones[0], track: 'missing', date: undefined, phase: undefined };
  assert.throws(() => validateDiagramDocument({ type: 'timeline', diagram }), /track|date|phase/i);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test --test-name-pattern=timeline test/renderers.test.mjs`

Expected: timeline registry dispatch is unsupported.

- [ ] **Step 3: Implement validation and track geometry**

Sort by numeric position with ID tie-breaking, draw labeled tracks and milestone markers, route optional dependencies behind labels, and preserve current/proposed/completed/risk semantics.

- [ ] **Step 4: Verify accessibility, chronology, and determinism**

Run: `node --test --test-name-pattern=timeline test/renderers.test.mjs`

Expected: all timeline behaviors pass and two renders from identical input are byte-identical.

- [ ] **Step 5: Commit the timeline renderer**

```bash
git add schemas/timeline.schema.json lib/renderers/timeline.mjs lib/renderer-registry.mjs examples/payment-migration.timeline.json test/renderers.test.mjs
git commit -m "Add native engineering timeline renderer"
```

### Task 6: Native architecture-layers renderer

**Files:**
- Create: `schemas/layers.schema.json`
- Create: `lib/renderers/layers.mjs`
- Create: `examples/checkout-controls.layers.json`
- Modify: `lib/renderer-registry.mjs`
- Modify: `test/renderers.test.mjs`

**Interfaces:**
- Layers IR contains ordered `layers`, allowed directed `dependencies`, optional cross-cutting `concerns`, and evidenced `gaps`.

- [ ] **Step 1: Write failing layer tests**

```js
test('layers renders ordered responsibilities and cross-cutting controls', () => {
  const diagram = readExample('checkout-controls.layers.json');
  assert.equal(validateDiagramDocument({ type: 'layers', diagram }).ok, true);
  const html = renderToTemporaryHtml('layers', diagram);
  assert.ok(html.indexOf('Interface') < html.indexOf('Domain'));
  assert.match(html, /Authorization/);
});

test('layers rejects unknown dependencies and duplicate order', () => {
  const diagram = readExample('checkout-controls.layers.json');
  diagram.layers[1] = { ...diagram.layers[1], order: diagram.layers[0].order };
  diagram.dependencies.push({ from: 'missing', to: diagram.layers[0].id, status: 'current' });
  assert.throws(() => validateDiagramDocument({ type: 'layers', diagram }), /order|endpoint/i);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test --test-name-pattern=layers test/renderers.test.mjs`

Expected: layers registry dispatch is unsupported.

- [ ] **Step 3: Implement validation and stacked-layer geometry**

Render order from top to bottom, place cross-cutting concerns in a protected side rail, route dependencies in a separate corridor, and render gaps as explicit review findings rather than normal responsibilities.

- [ ] **Step 4: Verify accessibility, budgets, and determinism**

Run: `node --test --test-name-pattern=layers test/renderers.test.mjs`

Expected: all layers behaviors pass and the HTML is responsive and deterministic.

- [ ] **Step 5: Commit the layers renderer**

```bash
git add schemas/layers.schema.json lib/renderers/layers.mjs lib/renderer-registry.mjs examples/checkout-controls.layers.json test/renderers.test.mjs
git commit -m "Add native architecture layers renderer"
```

### Task 7: End-to-end contracts, decomposition, and skills

**Files:**
- Modify: `mcp/tools.mjs`
- Modify: `bin/diago.mjs`
- Modify: `skills/diago-engineering-diagram/SKILL.md`
- Modify: `skills/diago-chat-architecture/SKILL.md`
- Modify: `skills/diago-review-diagram/SKILL.md`
- Create: `examples/repository-domain.diagram-plan.json`
- Create: `examples/conversation-architecture.diagram-plan.json`
- Modify: `test/mcp.test.mjs`
- Modify: `test/cli.test.mjs`
- Modify: `scripts/validate-repo.mjs`

**Interfaces:**
- Prompt, repository, and conversation contexts all generate v2 plans.
- Over-budget review emits a deterministic overview/detail recommendation and requires fidelity entries.

- [ ] **Step 1: Write failing end-to-end tests**

```js
test('MCP creates v2 plans for every evidence source kind', () => {
  for (const sourceKind of ['prompt', 'repository', 'conversation', 'mixed']) {
    const result = callTool('create_diagram_plan', {
      task: 'Map checkout entities, ownership, and behavior', sourceKind,
    });
    assert.equal(result.structuredContent.schemaVersion, 2);
    assert.equal(result.structuredContent.source.kind, sourceKind);
  }
});

test('review requires a fidelity ledger when content is decomposed', () => {
  const plan = createPlan('Map every service and dependency in the platform');
  plan.complexity.decomposition = 'overview-detail';
  const result = reviewPlan(plan);
  assert.ok(result.findings.some(({ code }) => code === 'missing-fidelity'));
});
```

- [ ] **Step 2: Run E2E tests and confirm RED**

Run: `node --test test/mcp.test.mjs test/cli.test.mjs test/plans.test.mjs`

Expected: new context and decomposition scenarios fail until all boundaries are wired.

- [ ] **Step 3: Complete boundary wiring and repository validation**

Register the new schemas/examples, verify each catalog entry has a schema and working adapter, and keep unsupported general charts out of tool enums and advice.

- [ ] **Step 4: Update all three skills**

Engineering selection must call `list_diagram_types` when unclear and record question/pattern/profile/budget/fidelity before IR. Chat architecture stays architecture-primary but can add model/timeline/layers detail from conversation evidence. Review flags a valid diagram that answers the wrong question.

- [ ] **Step 5: Run the complete behavioral suite**

Run: `npm run check`

Expected: repository validation and all unit/integration/E2E tests pass.

- [ ] **Step 6: Commit contracts and skills**

```bash
git add mcp/tools.mjs bin/diago.mjs skills examples test scripts/validate-repo.mjs
git commit -m "Complete engineering diagram workflows"
```

### Task 8: Public documentation and upstream provenance

**Files:**
- Modify: `README.md`
- Modify: `docs/index.html`
- Modify: `docs/app.js`
- Create: `vendor/diagram-design/LICENSE`
- Create: `vendor/diagram-design/methodology/diagram-selection.md`
- Modify: `vendor/upstreams.lock.json`
- Modify: `scripts/check-upstreams.mjs`
- Modify: `scripts/sync-upstreams.sh`
- Modify: `.github/workflows/upstream-sync.yml`
- Modify: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Public docs advertise exactly eight native diagram types and six MCP tools.
- `diagram-design` is a pinned, license-complete methodology source, not product branding.

- [ ] **Step 1: Pin the current upstream revision and minimal methodology files**

Resolve the full default-branch SHA from GitHub, copy its MIT license and the smallest selection reference needed for review, and add a `methodology-snapshot` lock entry. Add the source to read-only checks and scheduled synchronization.

- [ ] **Step 2: Update README capability and usage contracts**

Document profiles, plan-v2 fields, `diago types`, `list_diagram_types`, the three new JSON examples, prompt/project/chat use, v1 compatibility, and the eight-view decision table. Do not describe Diago as a combination of other repositories.

- [ ] **Step 3: Update GitHub Pages without replacing its design system**

Change verified counts to eight views and six tools, add Data model/Timeline/Layers cards, add three copyable decision prompts, and update the plan sample to schema v2. Preserve existing navigation, responsive tokens, and standard stdio installation language.

- [ ] **Step 4: Run structural checks**

Run: `npm run validate && node --check docs/app.js && git diff --check`

Expected: manifests, schemas, examples, skills, upstream pins, JavaScript syntax, and whitespace pass.

- [ ] **Step 5: Capture and visually review all changed surfaces**

Render the GitHub Pages home/usage sections at 1440px and 360px, plus each new standalone renderer example at 1440px and 360px. Verify no clipping, overlap, horizontal scrolling, inaccessible focus, unreadable labels, or stale screenshots. Run the mandatory independent design-system and visual-fidelity review passes on the complete fresh capture set.

- [ ] **Step 6: Commit documentation and provenance**

```bash
git add README.md docs vendor/diagram-design vendor/upstreams.lock.json scripts/check-upstreams.mjs scripts/sync-upstreams.sh .github/workflows/upstream-sync.yml THIRD_PARTY_NOTICES.md
git commit -m "Document eight engineering diagram views"
```

### Task 9: Code review, branch integration, release, cleanup, and Codex install

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Create: `CHANGELOG.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces merged `main`, annotated tag and GitHub release `v0.3.0`, clean repository branches/worktrees, and a local Codex plugin installation reporting version `0.3.0` with six MCP tools.

- [ ] **Step 1: Run independent code review against the approved spec**

Review the full feature range for plan alignment, correctness, security, evidence handling, renderer determinism, compatibility, tests, and documentation. Fix all Critical and Important findings using a new red-green test cycle, then repeat the review until merge-ready.

- [ ] **Step 2: Audit source size and project cleanliness**

Measure every modified `.mjs` file for pure LOC, split any file above 250 lines, remove ignored `.DS_Store` and generated artifacts, run `git diff --check`, and confirm only intentional changes remain.

- [ ] **Step 3: Merge authorized feature and outstanding upstream branches into `main`**

Merge the feature branch first. Integrate the three existing upstream-update branches by combining their independent pinned-source changes rather than selecting one conflicting lock file wholesale. Run the full suite on the merged result before deleting merged local branches, their owned `.worktrees/` paths, and the corresponding remote branches.

- [ ] **Step 4: Set version 0.3.0 consistently**

Use `npm version 0.3.0 --no-git-tag-version`, update both plugin manifests and Claude marketplace metadata, add release notes to `CHANGELOG.md`, and confirm no stale `0.2.0` user-facing version literals remain except historical release notes or compatibility text.

- [ ] **Step 5: Run the final release gate**

Run: `npm run check`, all eight CLI validation/render smoke scenarios, stdio initialize/tools-list/tool-call, `node bin/diago.mjs doctor --json`, HTML capture freshness checks, and `git diff --check`.

Expected: zero failures, eight native types, six MCP tools, version `0.3.0`, and clean artifacts.

- [ ] **Step 6: Commit, tag, push, and publish**

```bash
git add package.json package-lock.json .codex-plugin/plugin.json .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md
git commit -m "Release Diago 0.3.0"
git tag -a v0.3.0 -m "Diago 0.3.0"
git push origin main
git push origin v0.3.0
gh release create v0.3.0 --verify-tag --title "Diago 0.3.0" --notes-from-tag
```

- [ ] **Step 7: Install the exact released plugin in Codex**

Refresh the `amirtaherkhani/diago` marketplace, replace the existing `diago@diago` installation with the released version using the supported Codex plugin CLI, restart/new-session guidance if required, and verify the installed plugin manifests, all three `diago-*` skills, MCP initialize version `0.3.0`, and six listed MCP tools.

- [ ] **Step 8: Confirm final Git and GitHub state**

Confirm `main` matches `origin/main`, tag `v0.3.0` resolves to the release commit, no feature/upstream branches remain locally or remotely, no owned worktree remains, and the primary checkout is clean.
