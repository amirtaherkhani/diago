---
name: engineering-diagram
description: Create evidence-grounded software engineering diagrams for architecture, feature flows, workflows, sequences, data movement, lifecycles, design patterns, and best-practice decisions. Use when a task, feature, code path, system design, technical explanation, implementation plan, incident, or architecture decision would be clearer as an interactive diagram or visual walkthrough.
---

# Engineering Diagram

Turn engineering evidence into a diagram that answers one explicit question. Prefer a small, truthful view over a complete but unreadable system map.

## Workflow

1. Inspect the task and its evidence before drawing. Read the relevant code, configuration, API contracts, tests, logs, or design notes.
2. State the audience, the decision the diagram supports, and the system boundary.
3. Separate verified facts, assumptions, and recommendations. Never render an assumption as an observed fact.
4. Choose the diagram type with `references/diagram-selection.md`. Run the bundled advisor when the request spans several possible views:

   ```bash
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diagram-toolkit.mjs" advise "<task or feature>" --json
   ```

5. Create a plan from `assets/diagram-plan.json`. Keep one primary question per view and link every important node or edge to evidence.
6. Author Archify JSON IR. Use the schemas and examples under the plugin root at `vendor/archify/schemas/` and `examples/`.
7. Validate and render:

   ```bash
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diagram-toolkit.mjs" validate <type> <input.json>
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diagram-toolkit.mjs" render <type> <input.json> <output.html>
   ```

8. Inspect the HTML at desktop and mobile widths. Apply `references/quality-gates.md` before delivery.
9. Explain the result in three short sections: verified behavior, design responsibility, and limitations or open questions.

## Evidence Contract

Read `references/evidence-contract.md` before diagramming an existing repository, production system, incident, security boundary, or externally documented API.

Use these visual semantics consistently:

- Solid line: verified runtime or code path.
- Dashed line: planned or recommended path.
- Dotted line: optional, async, or conditional path.
- Fact badge: directly supported by a cited source.
- Assumption badge: plausible but not yet verified.
- Recommendation badge: proposed improvement, never current behavior.

## Output Contract

Deliver:

- the source JSON IR;
- a validated standalone HTML diagram;
- a concise evidence legend;
- the primary walkthrough in five to nine steps;
- open questions that materially affect the design.

Do not invent services, protocols, queues, databases, ownership, or deployment boundaries. Do not hide uncertainty in decorative labels.
