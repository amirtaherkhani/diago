# Compact architecture explorer

1. Read the existing evidence contract. Inspect relevant code and reconcile facts before writing the model.
2. Read plugin-root `schemas/architecture-explorer.schema.json` and `examples/diago.architecture-explorer.json`.
3. Define `components` and `evidence` once; reference their IDs in `views`. Add component `detail` only for a bounded child view with a useful question. Use global IDs and citations for every verified component or edge.
4. Limit recursion to 6 views deep, 12 nodes and 20 relationships per view. Do not produce a view for every file. Preserve uncertainty and record omitted scope.
5. Author semantic JSON only. Do not generate CSS, HTML, JavaScript, coordinates, or duplicated per-view prose. Diago supplies its own navy/yellow design, layout, navigation, and inspector.
6. Prefer `diago explore <saved-input.json> <output.html>` when JSON is on disk. Otherwise call `render_explorer` once with `document` and absolute `outputPath`. Rendering validates all perspectives and returns a short artifact receipt.
7. Inspect overview, detail navigation, sources, narrow view, and keyboard operation before delivery. Return the file link and limitations instead of echoing the source or HTML.

The explorer shows component relationships. Use the existing specialized renderers for exact message order, lifecycle transitions, entity cardinality, or timeline semantics. It does not scan code itself or prove supplied citations. See plugin-root `docs/architecture-explorer.md` for the complete workflow and byte-count metrics.
