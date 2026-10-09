# Guided walkthroughs (source checkout)

Diago adapts Architecture Diagram Skill's teaching model to its eight specialized outputs: Architecture, Sequence, Workflow, Dataflow, Lifecycle, Data model, Timeline, and Layers.

Open **Guided walkthrough** above the diagram:

- Review all authored connections or just those around one component.
- Use Previous/Next, or Left/Right while focused in the player.
- Play advances every three seconds and stops at the last connection. Pause, close, hide the tab, or change the filter to stop it. Reduced-motion users get manual stepping.
- See the source, target, current connection, and the other participating components together. Components outside the selected group are dimmed; evidence colors remain unchanged.
- While the walkthrough is open, click or press Enter/Space on a node to jump to its first selected connection. A node outside the selection produces explanatory feedback. Native diagrams also open the walkthrough when a node is activated.
- Download a companion Markdown explanation of the selected connections.

## Grounding and scope

This is a connection walkthrough, not a simulation. The order comes from the rendered diagram; it does not establish runtime execution, causality, or a deployment mode. Details come from authored labels and accessible node descriptions. No payloads, latency estimates, or environment variants are invented. The selector groups existing connections around a component; it does not create new business scenarios.

Archify already provides richer route/trace and presentation tools. Its controls continue to work when the walkthrough is closed. Opening Export closes the transient walkthrough so the exported diagram remains complete. Dragging nodes and deployment-mode toggles are not added by this integration; those require a separate authored layout/variant contract.

The architecture explorer keeps its existing multi-view navigation and evidence inspector. It is a separate output type, not one of these eight specialized renderers.

## Implementation

`lib/walkthrough/viewer.js` and `viewer.css` provide the shared offline player. Native desktop and mobile diagrams expose the same escaped node/connection attributes as Archify. `lib/renderers/walkthrough.mjs` embeds the fixed assets before delivery hashing. DOM text is assigned with `textContent`; no authored strings are executed as HTML or JavaScript.

No new dependency or repeated diagram JSON is required. CLI/MCP inputs and receipts remain unchanged. The MIT-licensed upstream snapshot stays byte-exact; this is an original Diago implementation of its interaction ideas.

Regenerate existing artifacts with the updated checkout. The existing v0.7.0 release does not include this feature.
