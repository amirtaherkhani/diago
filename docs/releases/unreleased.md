# Unreleased — next minor release

## Highlights

Diago's architecture explorer and eleven specialized renderers now present engineering evidence with a consistent navy/yellow design language.

## Added

- A compact embedded Diago plugin logo in every renderer header, with matching sizing in Architecture Explorer.

- Shared offline arrow semantics across all eleven models and Architecture Explorer, with six connection types, full assistive-technology descriptions, model-specific validation, and a six-view notation preview. Existing JSON works unchanged; optional `arrow` fields distinguish responses, events, dependencies, bidirectional links, and associations.

- Three deterministic engineering models inspired by Diagram Design: dependency graphs with shared dependents and structural cycles, role/resource security matrices with explicit unknowns, and evidence-labeled incident fishbones. Includes schemas, advisor recipes, CLI/MCP delivery, responsive light/dark views, and full source registers.
- A public preview and pinned review of all 44 upstream diagram references, documenting existing coverage and deferred candidates.

- Guided connection walkthroughs for nine connection-based renderers, with playback, filtering, node navigation, and companion Markdown downloads. Existing diagram schemas and CLI/MCP calls remain compatible.

- Offline architecture explorer with shared-component JSON, bounded multi-view navigation, drill-down, evidence inspection, search, and responsive light/dark themes.
- `diago explore` and the `render_explorer` MCP tool, returning compact artifact receipts.
- Reproducible eleven-renderer gallery and theme controls for native Data model, Timeline, and Layers outputs.
- Oh My Mermaid as a tracked methodology upstream with a source-level integration review.

## Changed

- Replaced the expandable Arrow guide with a compact, view-specific legend across all eleven renderer models and Architecture Explorer; full connection meanings remain available to assistive technology.
- Unified theme controls across all eleven renderers and Explorer: one accessible sun/moon switch in the top-right header tools, with consistent dimensions and pressed state.

- Reduced arrowhead dimensions by 25% in the shared diagram presentation and Explorer, preserving marker proportions, endpoint alignment, and exported SVG geometry. New directed models inherit this sizing.

- Subtle pastel decoration across light/dark renderer presets; removed heavy card and button shadows and reduced Explorer and website elevation.

- Archify's five rendered outputs use Diago presentation before validation and hashing; their interactive controls and export capabilities remain available.
- The bundled Archify snapshot tracks main at `bb990b17`, including updates newer than its release tags.

## Fixed

- Export buttons use one borderless yellow surface in both themes, without shadows or decorative layers. Keyboard focus uses an underline instead of an inset ring.

## Migration

No input-schema migration is required. Regenerate existing HTML with the updated source checkout to apply the new style. Existing v0.7.0 installations and files are unchanged. This document does not announce a published release.

## Configuration

Use `?theme=light` or `?theme=dark` for a specific initial appearance. Generate a local gallery with `node scripts/render-gallery.mjs tmp/renderer-gallery`; choose a new destination for subsequent runs.
