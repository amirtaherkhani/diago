# Diagram Design: engineering model review

Reviewed 2026-10-09 against [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) at [`f4547ee`](https://github.com/cathrynlavery/diagram-design/tree/f4547ee95f88e5b28a52517feff6b6c11cc657f9). This is also Diago's existing pinned commit: no snapshot update was needed. The README advertises 42 types; the recursive tree contains **44 `type-*.md` reference documents**. This review used those reference documents, including their contracts, geometry, complexity limits, and anti-patterns for the shortlisted models.

## Decision

Add three native models that answer engineering questions our existing renderers did not express directly:

| New model | Engineering use | Adopted idea | Diago adaptation |
| --- | --- | --- | --- |
| `dependency` | Package coupling, shared dependencies, circular imports | Multi-parent graph, fan-in, explicit cycles, bounded ranks | Derive strongly connected groups from authored edges; rank the condensed graph; number edges and retain full labels/evidence in a register. Direct dependents are not transitive impact or traffic. |
| `security-matrix` | RBAC and service/resource access review | Roles × resources, explicit permission cells, no connectors | Omitted cells are **Unknown**, never implicit deny. Exact permission text and evidence remain visible. Color denotes access category, not proof or risk severity. |
| `fishbone` | Incident and defect investigation | One observed effect, category bones, contributing causes | No mandatory confirmed root cause. Permit zero or multiple confirmed contributors, distinguish hypotheses and ruled-out candidates, and require authored evidence/context for each. |

The source reference's fixed brand, generated HTML, forced focal accents, and mandatory single root-cause rule are not imported. Diago uses its existing navy/yellow tokens, pastel fills, small arrowheads, shared theme control, semantic tables, and deterministic renderers. No new runtime dependency, network call, model-authored CSS, or copied vendor runtime is needed. Rendering returns the existing compact receipt.

## Full catalog disposition

“Existing” means the engineering question has an existing route; it does **not** claim identical layout or complete feature parity with that reference. Deferred types remain candidates, not supported renderer names.

| Upstream reference | Disposition | Reason / current route |
| --- | --- | --- |
| architecture | Existing | Component topology and trust boundaries → architecture. |
| architecture-delta | Deferred candidate | Useful for migrations, but needs paired identity, change classification, and synchronized layout. Two architecture views are not a true delta model. |
| axonometric-plan | Outside this iteration | Spatial floor/site plans; little value for ordinary software review. |
| bar | Deferred quantitative family | Useful for benchmarks; needs measured values, units, and shared axis semantics. |
| data-flow | Existing | Payload movement → dataflow; ownership handoffs → workflow. |
| db-schema | Deferred candidate | Data-model covers entities/fields/constraints; column-anchored foreign keys and physical DDL semantics require a distinct extension. |
| dependency | **Added** | Shared packages and cycles carry a different question from ownership topology. |
| deployment | Existing, partial | Architecture deployment-topology profile covers placement; no dedicated replica/rollout grammar claimed. |
| dp-integration | Existing | Integration surfaces/protocols → architecture. |
| dp-security-matrix | **Added as security-matrix** | Explicit role/resource permissions and unknowns. |
| er | Existing | data-model, with cardinality and evidence. |
| exploded | Outside this iteration | Physical part decomposition rather than software behavior. |
| fishbone | **Added** | Investigation hypotheses and contributors for one effect. |
| flowchart | Existing | workflow decision-flow. |
| gantt | Deferred candidate | Timeline handles milestones, but duration, overlap, dependency scheduling, and calendar validation are distinct. |
| heatmap | Deferred quantitative family | Useful for CI/latency matrices; complete grids, units, missing values, and honest scales need a numeric contract. |
| high-level | Existing | Architecture plus dataflow/layers for distinct questions; no ornamental chevron copy. |
| it-state | Existing | Architecture current-state evidence; proposed target kept separate. |
| journey | Deferred product family | Requires evidenced user actions and sentiment; not an incident/process substitute. |
| kanban | Deferred product family | Work-in-progress census and limits are distinct from state transitions. |
| layers | Existing | layers responsibility/control placement. |
| line | Deferred quantitative family | Time-series units, domains, gaps, and measurement provenance. |
| loop | Existing, partial | workflow/lifecycle for evidenced feedback paths; no automatic reinforcing-loop inference. |
| medallion | Existing | dataflow for promotions, layers for quality/control boundaries. |
| nested | Existing, partial | Architecture trust boundaries and Explorer drill-down; no dedicated arbitrary nesting view. |
| org-chart | Deferred ownership family | Accountability/reporting hierarchy differs from software dependencies. |
| polar | Deferred quantitative family | Ordered radial categories have limited engineering advantage over simpler charts. |
| process | Existing | workflow and dataflow according to control or payload question. |
| pyramid | Deferred | Prioritization/funnel interpretation requires explicit ordering or measured quantities. |
| quadrant | Deferred strategy family | Needs defensible dimensions and placements, not inferred scores. |
| radar | Deferred quantitative family | Normalized comparable metrics and directionality are prerequisites. |
| sankey | Deferred quantitative family | CI cost/traffic allocation is useful, but widths must encode quantities with conservation and explicit loss. |
| scatter | Deferred quantitative family | Requires paired measurements and units; does not establish causation. |
| sequence | Existing | sequence interaction order. |
| state | Existing | lifecycle guards/recovery/terminal outcomes. |
| story-map | Deferred product family | Narrative backlog and release cuts require accepted product priorities. |
| swimlane | Existing | workflow swimlane. |
| timeline | Existing | timeline phases, dates, milestones. |
| tree | Existing, partial | Simple acyclic dependencies fit dependency; arbitrary containment and organizational hierarchy need their own semantics. |
| treemap | Deferred quantitative family | Bundle/disk composition needs additive quantities and honest area scaling. |
| uml-class | Deferred candidate | Operations, visibility, inheritance, aggregation/composition, and typed arrowheads are not ER relationships. |
| venn | Deferred | Set membership/intersection claims add limited value over explicit sets/tables for this scope. |
| wardley | Deferred strategy family | Requires user need, value-chain position, and evidenced evolution assumptions. |
| waterfall | Deferred quantitative family | Signed contributions, totals, units, and balancing are required. |

## Shortlist trade-offs

Architecture delta and UML class are strong next candidates. Both require new semantic validation rather than reskinning architecture or ER. Gantt, physical schema, and heatmap are also useful, but broadening the catalog before implementing their distinguishing behavior would create misleading aliases. This iteration delivers three complete models instead of claiming every engineering-relevant reference is supported.

## Contracts and limits

- Dependency: at most 9 nodes, 14 unique directed edges, 4 condensed ranks. Self-dependencies are rejected; describe recursion separately. Cycles include all authored edges; inspect their statuses before treating them as verified. Fan-in counts only supplied direct edges. No package scanning, vulnerability analysis, or transitive impact inference.
- Security matrix: at most 6 roles × 12 resources. At most one cell per pair; exact labels plus `admin`, `write`, `read`, `none`, or `unknown`. This is a documented review, not an authorization engine; it does not evaluate inheritance, conditions, tenant context, or deny precedence.
- Fishbone: at most 6 nonempty categories and 3 causes per category. `hypothesis`, `confirmed`, and `ruled-out` are authored classifications. A nonempty evidence string is required, but the renderer cannot verify its truth. Every cause and the observed effect remains in the evidence register.
- All new model validators reject unknown fields, invalid references, duplicate identities, and oversized labels. Over-budget graphs require explicit overview/detail decomposition; no silent omission.
- Narrow screens use readable node/permission/cause lists and complete semantic HTML tables. Desktop preserves each model's visual grammar. Dependency walkthrough order is presentation order, never inferred execution. The other two models have no graph player.

## Source references

- [Dependency grammar](https://github.com/cathrynlavery/diagram-design/blob/f4547ee95f88e5b28a52517feff6b6c11cc657f9/skills/diagram-design/references/type-dependency.md)
- [Access matrix grammar](https://github.com/cathrynlavery/diagram-design/blob/f4547ee95f88e5b28a52517feff6b6c11cc657f9/skills/diagram-design/references/type-dp-security-matrix.md)
- [Fishbone grammar](https://github.com/cathrynlavery/diagram-design/blob/f4547ee95f88e5b28a52517feff6b6c11cc657f9/skills/diagram-design/references/type-fishbone.md)
- [Complete reference tree](https://github.com/cathrynlavery/diagram-design/tree/f4547ee95f88e5b28a52517feff6b6c11cc657f9/skills/diagram-design/references)

See [authoring and previews](../engineering-models.md). Existing vendored files remain exact upstream snapshots; this adaptation lives in canonical Diago modules, schemas, recipes, skills, and documentation.
