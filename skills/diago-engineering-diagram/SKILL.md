---
name: diago-engineering-diagram
description: Create evidence-grounded software engineering diagrams for architecture, sequences, workflows, data movement, lifecycles, data models, engineering timelines, architecture layers, dependency graphs, access matrices, incident fishbones, design patterns, and best-practice decisions. Use when a task, feature, code path, project, chat, system design, implementation plan, incident, migration, or architecture decision would be clearer as an interactive diagram or visual walkthrough.
---

# Engineering Diagram

Turn engineering evidence into a diagram that answers one explicit question. Prefer a small, truthful view over a complete but unreadable system map.

## Multi-view architecture explorer

For repository-wide architecture with meaningful drill-down, read `references/architecture-explorer.md`. Use a compact shared-component document and `render_explorer`, or `diago explore <input.json> <output.html>`. This is a composition mode; keep the eleven specialized renderer types for precise flow, state, sequence, and data-model semantics.

## Workflow

1. Name the input source as `prompt`, `repository`, `conversation`, or `mixed`. State the audience detail, delivery destination, decision, and system boundary.
2. Inspect evidence before drawing. Read relevant code, configuration, contracts, tests, migrations, logs, traces, runtime state, or accepted conversation decisions. For multiple independent sources and dependent cross-checks, use `plan_evidence_workflow` or `diago evidence <workflow.json> --json`; follow the evidence contract for snapshot ownership and verification limits.
3. Separate verified facts, assumptions, recommendations, and superseded decisions. Never render an assumption or superseded proposal as current behavior.
4. Choose the reader question before the visual type. Read `references/diagram-selection.md`. When the native capability or profile is unclear, call `list_diagram_types`; then call `advise_diagram` with the task and available context. Otherwise run:

   ```bash
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" types --json
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" advise "<task or feature>" --json
   ```

5. Record the selected question kind, semantic pattern, renderer, profile, rationale, audience, bounded complexity budget, and fidelity ledger before authoring geometry. Call `create_diagram_plan`, or fill `assets/diagram-plan.json`. Keep exactly one primary view; add bounded detail views only when a second question carries the decision.
6. If the source exceeds its budget, reduce in this order: repeated presentation detail, exact replicas, evidenced leaf groups, cross-cutting detail, then overview/detail split. Record every merge, collapse, omission, and preserved claim in `fidelity`.
7. Author renderer JSON IR. Use `vendor/archify/schemas/` for architecture, sequence, workflow, dataflow, and lifecycle. Use the plugin-root `schemas/` for data-model, timeline, layers, dependency, security-matrix, and fishbone. Start from the corresponding file in `examples/`.
8. Call `validate_diagram`. After it passes, call `render_diagram` with an absolute `.html` path. Use `overwrite: true` only when replacement is intended. If MCP tools are unavailable:

   ```bash
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" validate <type> <input.json>
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" render <type> <input.json> <output.html>
   ```

9. Inspect the HTML at 1440 px and 360 px. Apply `references/quality-gates.md` before delivery.
10. Explain the result in three short sections: verified behavior, design responsibility, and limitations or open questions. Include the fidelity ledger when any source content was reduced.

## Evidence Contract

Read `references/evidence-contract.md` before diagramming an existing repository, production system, incident, security boundary, or externally documented API.

Use these visual semantics consistently:

- Solid line: verified runtime or code path.
- Dashed line: planned or recommended path.
- Dotted line: optional, async, or conditional path.
- Fact badge: directly supported by a cited source.
- Assumption badge: plausible but not yet verified.
- Recommendation badge: proposed improvement, never current behavior.
- Superseded badge: an earlier decision retained for history, never current behavior.

## Output Contract

Deliver:

- the source JSON IR;
- a validated standalone HTML diagram;
- a concise evidence legend;
- a short walkthrough for directed graphs, or the permission/cause evidence register for matrix and fishbone models;
- the renderer profile, complexity decision, and fidelity ledger;
- open questions that materially affect the design.

Do not invent services, protocols, queues, databases, ownership, or deployment boundaries. Do not hide uncertainty in decorative labels.

## Guided explanation

All outputs include an Arrow guide. Use the optional connection `arrow` field only when source evidence supports the meaning. `list_diagram_types` / `diago types --json` reports model-specific defaults and allowed types. Read `references/arrows.md` before overriding defaults; do not generate extra SVG/CSS for arrow styling.

Rendered connection-based diagrams include an optional Guided walkthrough player. Use its source/target/participant states to explain authored connections and download the companion Markdown when useful. Do not describe diagram order as runtime order without evidence. Do not duplicate HTML, CSS, or diagram JSON to add the player; the renderer embeds it. Mode variants, payload examples, and temporal ordering require authored evidence.

For dependency graphs, report direct fan-in and structural cycles without claiming runtime order. For access matrices, missing permissions stay unknown. For fishbones, retain hypotheses and ruled-out candidates; never require or invent one confirmed root cause. Read `references/engineering-models.md` before authoring these types.
