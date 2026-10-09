# Additional engineering models (source checkout)

The source catalog has **11 specialized renderers**. Dependency, security-matrix, and fishbone are additions after v0.7.0, alongside the existing eight types. The architecture explorer remains a separate composition mode. Existing v0.7.0 plugin installations do not gain these models automatically.

[Research and all 44 upstream dispositions](upstreams/diagram-design-engineering-review.md) · [Browser examples](models/)

| Type / profile | Question | Example | Budget |
| --- | --- | --- | --- |
| `dependency` / `module-dependencies` | What directly depends on what, where is reuse, and where are cycles? | `examples/checkout.dependency.json` | 9 nodes, 14 edges, 4 condensed ranks |
| `security-matrix` / `access-review` | Which roles have which permissions on which resources? | `examples/platform.security-matrix.json` | 6 roles, 12 resources, 72 cells |
| `fishbone` / `incident-cause-analysis` | Which investigated causes might explain one observed effect? | `examples/latency.fishbone.json` | 6 categories, 3 causes each |

## Generate an artifact

```bash
node bin/diago.mjs types --json
node bin/diago.mjs advise "Show a dependency graph with circular imports" --json
node bin/diago.mjs validate dependency examples/checkout.dependency.json
node bin/diago.mjs deliver dependency examples/checkout.dependency.json /tmp/dependency.html --json
node bin/diago.mjs render security-matrix examples/platform.security-matrix.json /tmp/access.html
node bin/diago.mjs render fishbone examples/latency.fishbone.json /tmp/incident.html
```

The existing MCP `list_diagram_types`, `advise_diagram`, `create_diagram_plan`, `validate_diagram`, and `render_diagram` tools support the same types. Author only the compact JSON; Diago generates layout, theme controls, responsive views, and evidence tables. No generated HTML needs to be returned to the model. Input contracts are in `schemas/<type>.schema.json`.

## Evidence semantics

- **Dependency:** `from` depends on `to`. Nodes have `id`, `label`, `kind`, `status`, and `evidence`; edges have `from`, `to`, `label`, `status`, and `evidence`. Status is `verified`, `proposed`, or `assumption`. Strongly connected groups receive a common rank; every internal edge is marked as part of a structural cycle. These cycles can include unverified edges. Direct dependents do not measure traffic or transitive blast radius. Singletons and disconnected graphs are valid.
- **Security matrix:** define `roles`, `resources`, and `permissions`. Every supplied permission identifies a `role` and `resource`, exact `value`, `level`, and `evidence`. Levels are `admin`, `write`, `read`, `none`, `unknown`; they are presentation categories, not a permission hierarchy. Missing cells stay **Unknown**. Explicit denial requires an authored `none` cell and evidence. Document the environment and policy context in the subtitle and sources.
- **Fishbone:** define one `effect` with `label` and `evidence`, then `categories` with `id`, `label`, and nonempty `causes`. Every cause needs `id`, `label`, `status`, and `evidence`. Status is `hypothesis`, `confirmed`, or `ruled-out`. Evidence may identify a source or the open question for a hypothesis. Zero or multiple confirmed contributors are valid; the renderer never proves causality.

All supplied evidence is displayed as escaped text. Validation establishes structural consistency and budgets, not the truth of a source claim. Labels have explicit length budgets; shorten labels and retain context in `evidence` instead of silently dropping content.

## Interaction and presentation

All three reuse Diago's light/dark themes and top-right sun/moon switch, flat surfaces, and restrained pastel fills. Dependency adds the shared guided walkthrough and Markdown download. Matrices and fishbones have complete accessible source tables rather than a fabricated directed traversal. At narrow widths, readable lists preserve every item and classification; tables can scroll inside their labeled regions.

Generate all 11 examples with `node scripts/render-gallery.mjs tmp/renderer-gallery-new`. Existing output directories are protected. The public three-model preview can be regenerated with `node scripts/render-engineering-preview.mjs`.
