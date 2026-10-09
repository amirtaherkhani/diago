# Arrow guide

Every Diago model and Architecture Explorer includes a small **Arrow legend** above the canvas. It shows only the connection types used in the current view, with a short label and a compact arrow sample. Hover or assistive technology exposes each type’s full meaning. Models without arrows state that briefly. The helper is embedded offline; no package, network request, or model-generated styling is required.

## Six connection types

| `arrow` | Head | Meaning |
|---|---|---|
| `directed` | Filled triangle | One-way authored connection |
| `response` | Open chevron | Reply to an earlier interaction, in the authored direction |
| `event` | Double open chevron | Explicit event or asynchronous notification |
| `dependency` | Hollow triangle | Required relationship; the label states prerequisite/dependent direction |
| `bidirectional` | Filled triangle at both ends | The same relationship applies in both directions |
| `association` | No head | Structural association; read cardinality labels |

These are Diago conventions, not a complete UML notation. Colors and line dashes retain their model-specific evidence/status/classification meaning. A dashed line alone never establishes asynchronous behavior. Labels and evidence remain authoritative; never infer runtime order from layout alone. The compact on-canvas legend shows only the types used in that view; this page documents all supported types.

[Interactive examples](https://amirtaherkhani.github.io/diago/arrows/) use fictional proposed relationships. Their [compact source](../examples/arrow-types.architecture-explorer.json) stores the two components once and varies only the connection across six views.

## Authoring

Add the optional `arrow` property to an existing connection:

```json
{
  "from": "publisher",
  "to": "subscriber",
  "label": "Publish order.created",
  "arrow": "event"
}
```

Keep the model's other required fields, evidence and references. The property does not reverse `from`/`to`. A response must explicitly connect the responder to its recipient. Use bidirectional only when the same label is valid both ways; two different interactions need two edges.

| Model | Connection collection | Default | Allowed overrides |
|---|---|---|---|
| Architecture | `connections` | directed | All six |
| Architecture Explorer | each view's `edges` | directed | All six |
| Sequence | `messages` | directed | directed, response, event |
| Workflow | `edges` | directed | directed, response, event |
| Dataflow | `flows` | directed | directed, response, event |
| Lifecycle | `transitions` | directed | directed |
| Data model | `relationships` | association | association |
| Timeline | `dependencies` | dependency | dependency |
| Layers | `dependencies` | dependency | dependency |
| Dependency | `edges` | dependency | dependency |

Sequence's existing `variant: "return"` selects response automatically. A conflicting explicit type is rejected. Restricted models preserve their grammar: cardinalities remain visible on data-model associations; dependencies and state transitions retain their intended direction.

Security matrix uses permission cells, not arrows. Its guide explains that access does not imply execution order. Fishbone's display-only spine points to the observed effect; its branches group investigated candidates and do not establish causation. Neither model accepts arbitrary arrow types.

## Rendering and compatibility

- Existing inputs require no migration. Regenerate HTML from the updated source checkout to get the compact legend and model-specific heads.
- CLI and MCP use the same validation and presentation. Invalid or unsupported types fail before delivery.
- The Archify-backed models accept `arrow` through Diago's adapter. Their vendored snapshots and upstream schema contracts remain unchanged; the raw upstream CLI does not accept this extension.
- On narrow screens, native models may present connections as lists. The legend describes those entries without inventing connector geometry.
- The legend follows light/dark themes and current Explorer navigation. Walkthroughs and companion Markdown use `↔` for bidirectional links and `—` for associations.
- Archify's route/reachability tools exclude associations and follow stored endpoints for other types. A bidirectional head does not synthesize a reverse route; author two directed connections when tracing both directions is required.
- The authoring reference is explanatory; not every type is appropriate for every model. Omit `arrow` when the default correctly describes the evidence.

This is a source-checkout addition after v0.7.0, not a new published plugin release.
