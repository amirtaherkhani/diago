# Diago renderer presentation (source checkout)

All eleven specialized renderers use Diago's midnight navy surfaces, yellow brand accent, system-font headings, and distinct evidence colors. Architecture, Sequence, Workflow, Dataflow, and Lifecycle retain Archify's interaction and export features; Data model, Timeline, Layers, Dependency, Security matrix, and Fishbone support light/dark themes, including `?theme=light` and a keyboard-accessible theme button.

Yellow identifies the brand. Mint remains verification, amber uncertainty, blue proposed/current relationships, and rose risk. Labels, line styles, diagram structure, and source evidence retain their meaning.

## Ownership and delivery

`lib/renderers/presentation.mjs` owns the common presentation tokens. Native SVGs reference those tokens instead of fixed dark fills. Archify render/deliver commands prepare a private temporary runtime with the Diago stylesheet applied **before** generation, validation, and artifact hashing. The directory is removed when the command finishes. CLI and MCP use this same boundary. Delivery receipts and provenance describe the final branded bytes; SVG/raster exports inherit the theme through Archify's stylesheet collector.

The ~3 MB bundled runtime is copied locally for each Archify render/delivery. There is no network request, new package dependency, or model-generated stylesheet. Validation-only commands use the original runtime directly unless the input uses Diago’s optional arrow extension; that extension is validated before a disposable adapter delegates the remaining fields to upstream validation. Future template changes fail explicitly if the expected header/head contract disappears.

The tracked `vendor/` snapshots remain exact upstream copies. Architecture Diagram Skill, UI UX Pro Max, Diagram Design, and Oh My Mermaid supply methodology; they do not each have a separate runtime viewer. Their guidance is expressed through Diago's renderers and architecture explorer.

## Preview every renderer

```bash
node scripts/render-gallery.mjs tmp/renderer-gallery
python3 -m http.server 8766 --bind 127.0.0.1 --directory tmp/renderer-gallery
```

Open `http://127.0.0.1:8766/`. Each renderer has dark and light links. The generator refuses an existing destination; choose a new directory for another run. Samples illustrate layout, not verified production facts. The generated standalone HTML also opens directly from disk.

## Scope

This change is available in the source checkout, after v0.7.0. Existing exported files and already-installed v0.7.0 plugins do not change automatically; regenerate an artifact using the updated checkout. Compact JSON inputs and artifact receipts remain unchanged, so no additional model output is required to author the visual style.

## Theme control

Every renderer and Explorer uses the shared sun/moon switch in `lib/renderers/theme-control.mjs`. It sits in the right-aligned header tools (above the title on narrow screens), has a 56 × 44px hit area, exposes light mode through `aria-pressed`, and supports Enter/Space. Theme changes preserve diagram controls and content.

The three [additional engineering models](engineering-models.md) retain specialized semantics: access color encodes permission level; fishbone status encodes an authored investigation finding. Unknown permissions are explicitly labeled. Both provide evidence registers rather than directed walkthroughs.

## Connection meaning

The shared [Arrow guide](arrow-guide.md) shows the types used in the current view. Arrowheads describe relationship semantics independently of existing evidence colors and line dashes. The gallery includes a six-view arrow example.
