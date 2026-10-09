# Changelog

All notable changes to Diago are documented here.

## [Unreleased]

### Added

- A native Diago architecture explorer with offline multi-view navigation, bounded component drill-down, evidence inspection, search, light/dark themes, and responsive layout.
- Compact shared-component JSON authoring, `diago explore`, and the `render_explorer` MCP tool; rendering returns an artifact receipt instead of generated HTML to reduce conversation payload.
- Oh My Mermaid as a fifth tracked upstream, with an MIT-licensed architecture-scanning methodology snapshot, weekly synchronization, and a source-level compatibility and security review.

### Changed

- Unified all eight specialized renderer outputs with Diago’s navy/yellow presentation; preserved Archify interactions and export themes, added native light/dark controls, and provided a reproducible eight-renderer gallery. Final delivery hashes and provenance include the branded output.

- Refreshed the bundled Archify snapshot to main commit `bb990b17` and switched upstream discovery and synchronization to track main, including updates newer than release tags. The renderer and schema contracts remain unchanged.

### Fixed

- Corrected the Export button’s layered background in light/dark output: the visible pill now carries the yellow accent with readable text in normal, hovered, and expanded states.

## [0.7.0] - 2026-10-08

### Added

- Accessible X, Hashnode, and DEV logo links beside the navigation in the homepage and getting-started guide footers.
- A public getting-started guide and FAQ covering installation, diagram outputs, local MCP operation, and released versus source-only features.
- Dependency-aware evidence planning through `diago evidence` and the read-only `plan_evidence_workflow` MCP tool, with a versioned workflow schema and checkout example.
- Bounded ready-task selection, local failure reporting, elapsed-time timeout accounting, and per-node retry limits without blocking unrelated evidence work.
- Claim reconciliation that preserves citations, flags contradictory reports, and keeps unverified or rejected claims out of diagram-plan facts.

### Changed

- Improved search and sharing metadata, linked website and software structured data, and refreshed sitemap entries for the homepage and guide.
- Adopted the yellow interlocking D logo and midnight-blue brand across the plugin, GitHub Pages, repository banner, and social previews.
- Redesigned the README with a playful navy-and-yellow header, GitHub callouts, expandable setup and prompt recipes, contribution checklists, and a maintainer guide to discoverability.
- Replaced the GitHub Pages header's GitHub text button with an accessible GitHub icon link.

### Fixed

- Stopped automatic hero preview transitions and motion-preference changes from scrolling readers away from lower page sections.

## [0.6.0] - 2026-10-08

### Added

- An upstream-update skill covering complete source discovery, sequential snapshot synchronization, compatibility review, and repository integration.

### Changed

- Updated the bundled Archify runtime to `v3.0.1` and refreshed the UI UX Pro Max and Diagram Design pins; preserved the bundled JetBrains Mono font license.
- Evidence collection now follows actual dependencies, records unavailable sources explicitly, and bounds verification repair loops.

### Performance

- Upstream discovery runs up to four independent GitHub requests concurrently.

### Fixed

- Upstream discovery now times out stalled requests, validates returned refs and commit SHAs, and retains successful results when another source fails. Incomplete checks exit nonzero and report unresolved sources explicitly.

## [0.5.0] - 2026-09-22

### Added

- Archify workflow schema v2 with constraint-driven layout, migration support, and stable layout diagnostics while preserving legacy schema-v1 rendering.
- Built-in brand marks, safe URL-based mark capture, localized Viewer UI, visual presets, and opt-in sequence-column spreading.

### Changed

- Updated the bundled Archify runtime from `v2.13.0` to `v2.16.0` and refreshed the pinned UI UX Pro Max and Diagram Design methodology snapshots.
- Diagram authoring guidance now covers desktop readability, multilingual output, brand identity, relationship-label preservation, and deployment-ownership checks.

### Fixed

- Pulled upstream renderer corrections for automatic routing, label measurement, viewport fitting, navigation-dock clearance, XML-safe SVG markers, emoji text fitting, and vertical data-flow edges.

## [0.4.0] - 2026-08-13

### Added

- An animated eight-view GitHub Pages workbench with architecture, sequence, workflow, dataflow, lifecycle, data-model, timeline, and layers examples.
- Keyboard-accessible diagram canvases with mobile panning guidance and Arrow, Home, and End controls.
- Pause, resume, temporary interaction holds, and reduced-motion behavior for the hero preview.

### Changed

- The hero workbench now uses documented semantic material, typography, spacing, geometry, stroke, and dash tokens.
- Responsive layouts keep all eight views discoverable in a desktop/tablet grid and a contained mobile tab rail without page overflow.

### Fixed

- Restored visible relationship strokes, markers, and labels across every preview view.
- Separated timeline lane and milestone labels to prevent overlap at desktop, tablet, and mobile widths.

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
