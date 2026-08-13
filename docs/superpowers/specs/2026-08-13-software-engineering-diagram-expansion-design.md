# Software Engineering Diagram Expansion

**Status:** Draft for written review; concept approved
**Date:** 2026-08-13
**Product:** Diago

## Summary

Diago will remain a software-engineering visualization toolkit. It will learn from the broader diagram taxonomy and selection discipline in `cathrynlavery/diagram-design`, but it will not become a general-purpose chart studio.

The expansion adds three deterministic engineering renderers—data model, engineering timeline, and architecture layers—and strengthens the selection path used for prompts, repositories, and conversations. Diago will select a reader question, semantic pattern, diagram profile, and supported renderer before authoring geometry. It will never recommend a diagram it cannot validate and render.

## Goals

- Choose the smallest accurate engineering visualization for a task, project, or chat.
- Cover structural, behavioral, data, state, model, temporal, and layered engineering questions.
- Preserve evidence provenance and uncertainty from input through delivery.
- Make audience, detail, complexity, and decomposition explicit in the diagram plan.
- Explain any information merged, collapsed, or omitted from the source.
- Keep output deterministic, accessible, standalone, and reviewable.
- Preserve the standard local stdio MCP package for Codex and Claude Code.

## Non-goals

- General business intelligence or marketing charts.
- Bar, line, scatter, radar, Venn, funnel, and decorative infographic renderers.
- Arbitrary animation or presentation scripting.
- Draw.io or Mermaid import in this expansion.
- PNG, PDF, or standalone SVG export in this expansion.
- Replacing the evidence contract with prompt-only generation.
- Recommending unsupported types and approximating them with misleading layouts.

## Product boundary

A diagram belongs in Diago when it materially improves at least one of these decisions:

1. How software components are structured or owned.
2. How software behaves across time, decisions, failures, or retries.
3. How data moves, transforms, persists, or relates.
4. How an entity changes state.
5. How delivery, migration, incident, or release work unfolds over time.
6. How responsibilities, controls, or defenses are enforced across layers.

If prose, a table, or a short checklist communicates the same engineering decision more clearly, the advisor should recommend that instead of a diagram.

## Selection model

Selection uses four separate concepts. Keeping them separate prevents every new behavior from becoming a new renderer.

1. **Engineering question:** what the reader must understand.
2. **Semantic pattern:** the behavior or relationship that carries the meaning.
3. **Diagram profile:** the engineering specialization and vocabulary.
4. **Native renderer:** the deterministic layout grammar used for validation and delivery.

The pipeline is:

```text
prompt, repository, or conversation
              │
              ▼
      evidence-aware brief
              │
              ▼
      engineering question
              │
              ▼
       semantic pattern
              │
              ▼
        diagram profile
              │
              ▼
 supported native renderer
              │
              ▼
 validated standalone HTML
```

### Native renderers and profiles

| Renderer | Reader question | Engineering profiles |
| --- | --- | --- |
| `architecture` | What exists, what owns it, and how do boundaries connect? | feature context, system context, deployment topology, trust boundary, design pattern |
| `sequence` | What happens over time between participants? | request walkthrough, integration exchange, async retry, failure compensation |
| `workflow` | Which steps, decisions, owners, and handoffs control the outcome? | decision flow, swimlane, delivery process, incident response |
| `dataflow` | Where does data originate, transform, move, and persist? | event lineage, transformation pipeline, queue bottleneck |
| `lifecycle` | How does one entity change state and recover? | state machine, job lifecycle, retry and recovery |
| `data-model` | Which entities, fields, constraints, and relationships define the domain? | domain model, persistence schema, event model |
| `timeline` | Which engineering events or milestones occur, and in what temporal relationship? | delivery roadmap, migration plan, incident timeline, release history |
| `layers` | Where are responsibilities, abstractions, controls, or defenses enforced? | application layers, platform stack, control enforcement, defense layers |

Profiles specialize labels, required primitives, evidence expectations, and complexity budgets. They do not create separate rendering engines.

### Semantic patterns

The initial catalog includes:

- structural ownership and dependency;
- ordered interaction and response;
- branching decision and approval;
- cross-owner handoff;
- data lineage and transformation;
- fan-in queue and finite capacity;
- state transition and recovery;
- entity relationship and cardinality;
- milestone and migration progression;
- trust-boundary routing;
- layered responsibility or enforcement;
- compensating defenses and residual risk.

Each pattern routes to one nearest native renderer. A secondary pattern may contribute one supporting primitive. When two patterns both carry the decision, Diago creates linked overview and detail views instead of combining two layout grammars in one figure.

## Input workflows

All inputs normalize into the same evidence-aware brief before selection.

### Prompt

- Extract the engineering decision, audience, requested scope, constraints, and named systems.
- Treat user assertions as explicit statements, not independently verified runtime facts.
- Ask one focused question only when an unresolved ambiguity would change the renderer or system boundary.

### Repository or project

- Inspect relevant code, tests, contracts, configuration, migrations, and available runtime evidence.
- Prefer observed behavior and executable contracts over prose.
- Record branch, version, environment, or time boundaries when they affect a claim.
- Do not infer services, stores, protocols, or ownership from naming alone.

### Conversation or chat history

- Use only the active conversation, accessible history, or a supplied transcript.
- Resolve changed decisions by explicit confirmation and recency.
- Preserve superseded proposals in the evidence ledger without rendering them as current architecture.
- Never claim access to unavailable history or expose hidden instructions, private reasoning, credentials, or unrelated personal content.

## Diagram plan schema v2

Schema v2 keeps the existing evidence lanes and adds selection, source, complexity, and fidelity contracts.

```json
{
  "schemaVersion": 2,
  "task": "Add idempotent checkout",
  "goal": "Explain ownership and request behavior",
  "source": {
    "kind": "repository",
    "scope": "main at commit abc123",
    "references": ["src/checkout", "openapi.json"]
  },
  "audience": {
    "role": "backend engineers",
    "detail": "technical"
  },
  "selection": {
    "questionKind": "structural-ownership",
    "semanticPattern": "trust-boundary-routing",
    "renderer": "architecture",
    "profile": "feature-context",
    "rationale": "Ownership and dependency boundaries are the primary decision."
  },
  "scope": {
    "in": ["API", "orchestrator", "inventory", "payment", "idempotency store"],
    "out": ["provider settlement"]
  },
  "evidence": {
    "facts": [],
    "assumptions": [],
    "recommendations": [],
    "superseded": []
  },
  "complexity": {
    "detail": "balanced",
    "budget": { "nodes": 12, "edges": 16 },
    "decomposition": "single"
  },
  "views": [
    {
      "type": "architecture",
      "profile": "feature-context",
      "role": "primary",
      "question": "Which components own checkout and how do they depend on one another?",
      "focus": ["ownership", "trust boundaries", "dependencies"]
    }
  ],
  "fidelity": {
    "merged": [],
    "collapsed": [],
    "omitted": [],
    "preserved": []
  },
  "constraints": [],
  "output": {
    "format": "standalone-html",
    "quality": "showcase",
    "destination": "architecture-review"
  }
}
```

### Schema rules

- `source.kind` is `prompt`, `repository`, `conversation`, or `mixed`.
- `audience.detail` is `technical`, `mixed`, or `executive`; it changes wording, not evidence or truthfulness.
- `selection.renderer` must name a registered native renderer.
- `selection.profile` must belong to that renderer.
- Every view has a renderer `type`, compatible `profile`, `primary` or `detail` role, one explicit question, and bounded focus.
- Each fact must include a source and may include confidence and environment scope.
- Public artifacts use repository-relative or semantic source labels and exclude credentials, customer data, private hostnames, and local absolute paths.
- `superseded` records changed conversation or design decisions and is never treated as current behavior.
- `fidelity` is required when source content is reduced or diagrams are decomposed.
- Schema v1 remains accepted through the pre-1.0 release line and is normalized internally to v2 defaults. Removing it requires a major release.
- Newly generated plans use v2 only.

## Complexity and decomposition

Diago must not shrink text or hide edges to keep an oversized system on one canvas.

### Default balanced budgets

| Renderer | Budget |
| --- | --- |
| Architecture | 12 components, 16 connections, 4 boundaries |
| Sequence | 6 participants, 16 messages, 2 conditional segments |
| Workflow | 5 lanes, 12 steps, 16 edges |
| Dataflow | 6 stages, 12 nodes, 16 flows |
| Lifecycle | 12 states, 16 transitions |
| Data model | 8 entities, 12 relationships |
| Timeline | 12 milestones, 4 tracks |
| Layers | 7 layers, 24 concise items |

Profiles may impose stricter budgets. An `overview` detail level lowers the budget; `detailed` may raise it only to a renderer-specific validated ceiling.

When content exceeds the ceiling, Diago follows a fixed reduction order:

1. Remove decorative or repeated presentation detail.
2. Merge exact replicas into a counted cohort.
3. Collapse leaf groups into an evidenced parent capability.
4. Move cross-cutting detail to a linked detail view.
5. Split into one overview and bounded detail diagrams.

Every merge, collapse, or omission is recorded in the fidelity ledger. Evidence is never silently discarded.

## Renderer architecture

Diago introduces an engine-neutral renderer registry.

```text
diagram catalog
      │
      ├── renderer metadata and profiles
      ├── schema location
      ├── validator
      ├── renderer adapter
      └── complexity policy
```

- Existing architecture, sequence, workflow, dataflow, and lifecycle entries delegate to the bundled Archify runtime.
- Data model, timeline, and layers are Diago-owned deterministic renderers with Diago-owned JSON schemas.
- MCP and CLI code call the registry instead of branching directly on Archify types.
- A catalog entry becomes recommendable only after its schema, validator, renderer, examples, tests, and accessibility checks are registered.
- Vendor directories remain upstream-owned and are not patched with Diago-specific renderers, so upstream synchronization cannot overwrite product code.

### New renderer contracts

#### Data model

Required primitives include entities, fields, keys, optional constraints, relationships, direction, and cardinality. The renderer must distinguish verified schema facts from proposed modeling changes and must not invent fields or cardinalities.

#### Timeline

Required primitives include events or milestones, temporal position, labels, optional tracks, and current/proposed status. When exact dates are unknown, the plan must use ordered phases instead of false calendar precision.

#### Layers

Required primitives include ordered layers, responsibility or enforcement labels, allowed dependencies, cross-cutting concerns, and gaps. Physical deployment topology remains an architecture profile; layers are for abstraction or enforcement order.

## MCP contract

The stdio server grows from five to six tools.

### New tool

`list_diagram_types` returns:

- native renderer names;
- reader questions;
- supported profiles and semantic patterns;
- complexity ceilings;
- support status;
- concise examples of appropriate and inappropriate use.

This tool is read-only and deterministic.

### Existing tool changes

- `advise_diagram` accepts optional source kind, audience detail, and destination. It returns the semantic pattern, renderer, profile, rationale, budget, alternatives, and decomposition recommendation.
- `create_diagram_plan` emits schema v2 and accepts the same optional context.
- `review_diagram_plan` accepts v1 and v2, reports migration or fidelity issues, and rejects a renderer/profile mismatch.
- `validate_diagram` and `render_diagram` resolve renderer behavior through the registry.
- Tool errors name the unsupported type, list native alternatives, and never pretend that a general chart is supported.

## Skill behavior

### `diago-engineering-diagram`

- Select the engineering question before the visual type.
- Call `list_diagram_types` when the appropriate native capability is unclear.
- Record pattern, profile, audience, budget, and fidelity decisions before authoring IR.
- Use linked views when structure and time or model and behavior both carry the decision.

### `diago-chat-architecture`

- Keep architecture as the primary view for system conversations.
- Add data model, timeline, layers, sequence, or workflow only when conversation evidence supports the corresponding question.
- Reconcile superseded decisions and inaccessible history through schema v2 evidence fields.

### `diago-review-diagram`

- Review type/profile fit, evidence support, complexity, decomposition, and fidelity ledger completeness.
- Flag a technically valid diagram when it answers the wrong engineering question.

Skill changes require baseline and post-change prompt scenarios so the instructions demonstrate a measurable improvement rather than merely adding prose.

## Upstream provenance

`cathrynlavery/diagram-design` will be tracked as a pinned MIT-licensed methodology source.

- Preserve its copyright and license in a separated vendor snapshot.
- Pin a full commit SHA in `vendor/upstreams.lock.json`.
- Snapshot only the license and the small methodology references needed for review; do not vendor its full gallery, icons, templates, scripts, or brand.
- Add it to the read-only update checker and scheduled synchronization matrix.
- Review updates before adapting ideas into canonical Diago code or skills.
- Keep Diago documentation focused on its own capabilities rather than describing itself as a combination of other projects.

## Failure handling

- **Unsupported request:** recommend prose, a table, or a more appropriate tool; list the nearest native Diago views without silently substituting one.
- **Insufficient evidence:** return a draft plan with explicit assumptions and unresolved questions; do not promote assumptions to facts.
- **Ambiguous type:** choose the smallest primary view and return alternatives; ask only when the choice materially changes the decision.
- **Over budget:** return a deterministic decomposition plan and fidelity ledger instead of squeezing content.
- **Invalid v1 plan:** report existing validation findings; do not obscure them behind migration.
- **Renderer failure:** return actionable schema or geometry diagnostics without temporary paths or source secrets.
- **Conversation unavailable:** disclose the accessible window and request a transcript only when missing history materially changes the architecture.

## Compatibility and migration

- Existing v1 plans, five renderer names, CLI commands, and MCP calls remain valid.
- The catalog and registry initially expose only currently working renderers.
- New types are enabled for advice only when their full delivery gates pass.
- v1 normalization is internal and does not rewrite user files without an explicit output request.
- The standard stdio MCP transport and plugin installation flow remain unchanged.

## Delivery phases

### Phase 1: Selection foundation

- Add the catalog, semantic pattern routing, profiles, budgets, and schema v2.
- Add v1 normalization and `list_diagram_types`.
- Refactor MCP and CLI validation through the renderer registry.
- Keep the five existing types recommendable until later phases pass.

### Phase 2: Native renderer expansion

Implement and enable one renderer at a time in this order:

1. Data model, because repository schemas and domain relationships are common engineering evidence.
2. Timeline, because delivery, migration, release, and incident chronology are common workflows.
3. Layers, because application boundaries, controls, and defense placement are common architecture-review questions.

Each renderer ships with schema, fixtures, validation, rendering, examples, accessibility checks, and responsive visual evidence before becoming recommendable.

### Phase 3: Agent and documentation integration

- Update all three Diago skills and their test scenarios.
- Add public examples for prompt, repository, and conversation inputs.
- Update README and GitHub Pages taxonomy without claiming unsupported charts.
- Add upstream provenance and synchronization.

## Testing strategy

### Unit

- Question, pattern, renderer, and profile routing.
- Deterministic tie-breaking and fallback behavior.
- Budget calculation and decomposition.
- Fidelity ledger construction.
- Schema v1 normalization and v2 validation.
- Renderer/profile mismatch and unsupported-type errors.

### Integration

- Each new JSON schema with valid and adversarial fixtures.
- Renderer registry dispatch to both Archify-backed and Diago-owned engines.
- MCP output schemas for all six tools.
- CLI advice, plan, validation, review, and rendering across all enabled types.

### End-to-end

- Prompt to rendered artifact.
- Repository evidence to architecture plus data-model views.
- Conversation evidence to architecture plus an appropriate linked view.
- Oversized source to overview/detail artifacts and a fidelity ledger.
- Standard stdio initialize, tool listing, tool call, and standalone HTML delivery.

### Visual and accessibility

- Desktop and 360px browser captures for every new example.
- No overlap, clipping, horizontal page scroll, or unreadable labels.
- Accessible SVG title and description, keyboard focus, contrast, and reduced-motion behavior.
- Mechanical geometry checks for edge direction, endpoint validity, label bounds, and protected legend space.

## Acceptance criteria

The expansion is complete when:

- all eight native renderer types validate and render deterministic standalone HTML;
- the advisor never recommends a disabled or unsupported type;
- prompt, repository, and conversation inputs produce schema-v2 plans;
- v1 plans remain accepted by plan review and any workflow that consumes a plan; their referenced diagram IR remains valid for validation and rendering;
- over-budget inputs decompose without silently losing evidence;
- all MCP and CLI contracts pass automated tests;
- skill scenarios demonstrate correct type selection and evidence handling;
- new examples pass desktop, mobile, accessibility, and geometry gates;
- upstream provenance is pinned and license-complete;
- README and Pages describe only verified shipped capabilities.

## Deferred work

After this expansion is stable, separate designs may evaluate:

- draw.io and Mermaid structural import;
- SVG, PNG, and presentation-size exports;
- static-first controlled motion for ordered explanations;
- additional engineering-specific renderers supported by real use cases.

None of these deferred capabilities should be advertised or represented in the advisor until implemented and verified.
