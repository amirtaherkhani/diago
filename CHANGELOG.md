# Changelog

All notable changes to Diago are documented here.

## [0.3.0] - 2026-08-13

### Added

- An eight-type, question-first catalog covering architecture, sequence, workflow, dataflow, lifecycle, data model, engineering timeline, and architecture layers.
- Deterministic native renderers for data-model, timeline, and layers diagrams, including dedicated semantic mobile layouts.
- The `list_diagram_types` MCP tool and `diago types` CLI command for discovering profiles, semantic patterns, fit guidance, and complexity budgets.
- Schema-v2 diagram plans for prompt, repository, conversation, and mixed evidence sources, plus non-mutating schema-v1 review compatibility.
- Pinned diagram-selection methodology and reviewed upstream snapshot updates with complete MIT notices.

### Changed

- MCP, CLI, skills, examples, README, and GitHub Pages now expose exactly eight diagram types and six MCP tools.
- Diagram planning records audience, selection rationale, bounded complexity, decomposition, and a fidelity ledger before rendering.
- Entity relationships route around intervening nodes, and native standalone diagrams remain readable at desktop and phone widths.

### Security

- Render output can be constrained to `DIAGO_OUTPUT_ROOT`, with overwrite protection at the MCP boundary.
- Plan review blocks unsafe public source labels and reports malformed references or budgets without throwing.

## [0.2.0] - 2026-08-08

- Standardized Diago on a local stdio MCP package for Codex and Claude Code.
- Removed Kubernetes, HTTP transport, image publishing, and cluster deployment support.

## [0.1.0] - 2026-07-27

- Initial evidence-grounded engineering diagram toolkit, dual-agent plugin, skills, CLI, MCP tools, examples, and GitHub Pages site.
