# Unreleased — next minor release

## Highlights

Diago's architecture explorer and eight specialized renderers now present engineering evidence with a consistent navy/yellow design language.

## Added

- Offline architecture explorer with shared-component JSON, bounded multi-view navigation, drill-down, evidence inspection, search, and responsive light/dark themes.
- `diago explore` and the `render_explorer` MCP tool, returning compact artifact receipts.
- Reproducible eight-renderer gallery and theme controls for native Data model, Timeline, and Layers outputs.
- Oh My Mermaid as a tracked methodology upstream with a source-level integration review.

## Changed

- Reduced arrowhead dimensions by 25% across all eight diagram renderers and Explorer, preserving marker proportions, endpoint alignment, and exported SVG geometry.

- Subtle pastel decoration across light/dark renderer presets; removed heavy card and button shadows and reduced Explorer and website elevation.

- Archify's five rendered outputs use Diago presentation before validation and hashing; their interactive controls and export capabilities remain available.
- The bundled Archify snapshot tracks main at `bb990b17`, including updates newer than its release tags.

## Fixed

- Export buttons use one borderless yellow surface in both themes, without shadows or decorative layers. Keyboard focus uses an underline instead of an inset ring.

## Migration

No input-schema migration is required. Regenerate existing HTML with the updated source checkout to apply the new style. Existing v0.7.0 installations and files are unchanged. This document does not announce a published release.

## Configuration

Use `?theme=light` or `?theme=dark` for a specific initial appearance. Generate a local gallery with `node scripts/render-gallery.mjs tmp/renderer-gallery`; choose a new destination for subsequent runs.
