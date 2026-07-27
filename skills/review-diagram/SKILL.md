---
name: review-diagram
description: Review software architecture and engineering diagrams against source evidence, scope, readability, semantics, and implementation intent. Use when auditing a diagram, design document, pull request visual, system map, feature flow, design-pattern explanation, or generated HTML or JSON diagram before sharing or implementation.
---

# Review Diagram

Audit the diagram as an engineering artifact, not as decoration. Treat correctness, decision usefulness, and legibility as separate review lanes.

## Review Workflow

1. Identify the diagram's audience, question, scope, source JSON, and rendered artifact.
2. Inspect the cited code, configuration, contracts, tests, or documents. Mark unsupported claims.
3. Run deterministic checks when a plan or Archify IR is available. Prefer `review_diagram_plan` and `validate_diagram` MCP tools. If MCP tools are unavailable, use the CLI:

   ```bash
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" review <diagram-plan.json> --json
   node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" validate <type> <diagram.json>
   ```

4. Apply `references/review-checklist.md`.
5. Render and inspect desktop and mobile output. Exercise themes, steps, modes, focus states, and the details panel when present.
6. Return findings ordered by severity with the exact unsupported claim, visual problem, or missing decision context.

## Severity

- Blocker: materially false system behavior, security boundary, data ownership, or dependency.
- High: an important flow is missing, reversed, ambiguous, or presented as fact without evidence.
- Medium: the view cannot support its stated decision, or readability breaks for a common viewport.
- Low: minor visual, wording, or consistency issue.

## Acceptance

Approve only when:

- verified facts, assumptions, and recommendations are visibly distinct;
- every important edge has a direction and meaning;
- the primary walkthrough can be understood without narration;
- the diagram works at 360 px and 1440 px without clipped content;
- the source JSON validates and the standalone artifact opens without external runtime dependencies.
