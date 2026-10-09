# Connection arrows

Diago embeds an offline Arrow guide in every output. Arrowheads encode meaning while existing line dashes and colors retain their model-specific evidence or classification meaning. This is Diago notation, not a complete UML notation.

Optional `arrow` values:

- `directed`: filled triangle, one-way relationship.
- `response`: open chevron, reply in the authored `from` → `to` direction.
- `event`: double chevron, evidenced event or asynchronous notification.
- `dependency`: hollow triangle, required relationship; label the direction explicitly.
- `bidirectional`: filled triangles at both ends, same relationship both ways.
- `association`: no heads, structural association; retain cardinality labels.

Architecture connections and Explorer view edges accept all six. Sequence messages, workflow edges, and dataflow flows accept directed/response/event. Sequence `variant: return` implies response and rejects conflicting overrides. Lifecycle transitions accept directed only. Data-model relationships accept association only. Timeline/layer dependencies and dependency edges accept dependency only. Omit the property to use these defaults (directed for the first five renderers and Explorer).

Security matrices have no arrows. Fishbone uses a display-only effect spine, not arbitrary edge types or proof of causation. A dashed line alone never proves asynchronous behavior. Do not imply runtime ordering from layout, dependencies, or the walkthrough order.

Pass the extension through Diago CLI/MCP; the raw Archify schema does not define it. Keep all other model fields and evidence. Existing input documents remain compatible. Rendering produces the guide, heads, and compact artifact receipt without extra model-generated markup.
