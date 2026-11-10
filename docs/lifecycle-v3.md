# Migrate lifecycle diagrams to schema v3

Diago source checkouts that bundle Archify 3.2.0 require `schema_version: 3` for lifecycle diagrams. The CLI and MCP validators reject lifecycle v1 and v2 inputs, which must be converted by hand.

## Integration status

The Diago 0.8.0 source integration pins Archify 3.2.0 at `7e45f36c66de1254d5ad6ba1d878f6499ea269fd`. The published Diago v0.8.0 release uses the earlier pin `bb990b17` and accepts lifecycle v1 and v2. [v0.8.0 release notes](releases/v0.8.0.md)

## Convert an existing diagram

1. Keep the original JSON in a separate file and edit a copy.
2. Set `schema_version` to `3` and keep `diagram_type` set to `"lifecycle"`. Retain the state IDs, types, labels, and evidence references. Preserve transition IDs, endpoints, labels, notes, and variants.
3. Confirm the normal path from the initial state with the diagram author or system owner. Add it as `mainPath`, an ordered list of at least two distinct state IDs. Each consecutive pair needs a matching `from` and `to` transition in that direction. Resolve missing transitions with the author and source evidence before changing the graph. Keep retries, branches, and alternate outcomes as transitions. If several transitions connect a main-path pair in the same direction, Archify draws the first on the main row.
4. Preserve the meaning of any lane that identifies an owner, subsystem, or domain phase. Put that information in state labels, sublabels, or cards before removing the lane fields. For a single lane that describes the entire diagram, the subtitle may be enough.
5. Remove the old layout fields. Archify computes the placement of states, routes, and labels from `mainPath` and the transitions. States outside the main path may appear in a different order or with different spacing even when all IDs and transitions are preserved.

| Old location | Fields removed in v3 |
| --- | --- |
| Root | `lanes` |
| `meta` | `viewBox` |
| `states[]` | `lane`, `col`, `width`, `height`, `yOffset` |
| `transitions[]` | `route`, `fromSide`, `toSide`, `channelX`, `channelY`, `cornerRadius`, `labelAt`, `labelDx`, `labelDy`, `labelSegment`, `via`, `width` |

These fields have no direct v3 equivalents. Use the source evidence to recover any meaning conveyed by the old placement. [Bundled lifecycle schema](../vendor/archify/schemas/lifecycle.schema.json)

## Example

The original example placed `pending` and `delivered` in an **Artifact** lane. Its only transition goes from `pending` to `delivered` when rendering succeeds. In v3 that transition defines the main path, and **Artifact** becomes the subtitle. [Original v1 input](../test/fixtures/lifecycle-v1.json)

```json
{
  "schema_version": 3,
  "diagram_type": "lifecycle",
  "meta": {
    "title": "Diago delivery lifecycle",
    "subtitle": "Artifact",
    "output": "lifecycle.html",
    "animation": "none"
  },
  "mainPath": ["pending", "delivered"],
  "states": [
    {"id": "pending", "type": "start", "label": "Pending"},
    {"id": "delivered", "type": "success", "label": "Delivered"}
  ],
  "transitions": [
    {"from": "pending", "to": "delivered", "label": "Render succeeds"}
  ]
}
```

From the root of an updated Diago source checkout, validate and render the [maintained example](../examples/presentation/lifecycle.json).

```bash
node bin/diago.mjs validate lifecycle examples/presentation/lifecycle.json
node bin/diago.mjs render lifecycle examples/presentation/lifecycle.json lifecycle-v3.html
```

Open the rendered HTML and compare it with the original JSON. Check that state names, transition conditions, retry paths, alternate outcomes, and any meaning from the old lanes are still clear. The same v3 JSON can be passed to the `validate_diagram` and `render_diagram` MCP tools.
