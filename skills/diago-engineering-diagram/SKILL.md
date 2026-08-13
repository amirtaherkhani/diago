---
name: diago-engineering-diagram
description: Create evidence-grounded software engineering diagrams for architecture, sequences, workflows, data movement, lifecycles, data models, engineering timelines, architecture layers, design patterns, and best-practice decisions. Use when a task, feature, code path, project, chat, system design, implementation plan, incident, migration, or architecture decision would be clearer as an interactive diagram or visual walkthrough.
---

# Engineering Diagram

Turn engineering evidence into a diagram that answers one explicit question. Prefer a small, truthful view over a complete but unreadable system map.

## Workflow

1. Name the input source as `prompt`, `repository`, `conversation`, or `mixed`. State the audience detail, delivery destination, decision, and system boundary.
2. Inspect evidence before drawing. Read relevant code, configuration, contracts, tests, migrations, logs, traces, runtime state, or accepted conversation decisions.
3. Separate verified facts, assumptions, recommendations, and superseded decisions. Never render an assumption or superseded proposal as current behavior.
4. Choose the reader question before the visual type. Read `references/diagram-selection.md`. When the native capability or profile is unclear, call `list_diagram_types`; then call `advise_diagram` with the task and available context. Otherwise run:

   ```bash
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" types --json
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" advise "<task or feature>" --json
   ```

5. Record the selected question kind, semantic pattern, renderer, profile, rationale, audience, bounded complexity budget, and fidelity ledger before authoring geometry. Call `create_diagram_plan`, or fill `assets/diagram-plan.json`. Keep exactly one primary view; add bounded detail views only when a second question carries the decision.
6. If the source exceeds its budget, reduce in this order: repeated presentation detail, exact replicas, evidenced leaf groups, cross-cutting detail, then overview/detail split. Record every merge, collapse, omission, and preserved claim in `fidelity`.
7. Author renderer JSON IR. Use `vendor/archify/schemas/` for architecture, sequence, workflow, dataflow, and lifecycle. Use the plugin-root `schemas/` for data-model, timeline, and layers. Start from the corresponding file in `examples/`.
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
- the primary walkthrough in five to nine steps;
- the renderer profile, complexity decision, and fidelity ledger;
- open questions that materially affect the design.

Do not invent services, protocols, queues, databases, ownership, or deployment boundaries. Do not hide uncertainty in decorative labels.
