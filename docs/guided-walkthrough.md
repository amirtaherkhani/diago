# Guided walkthroughs

Diago v0.8.0 adds guided walkthroughs to nine connection-based renderers. They cover Architecture, Sequence, Workflow, Dataflow, Lifecycle, Data model, Timeline, Layers, and Dependency and draw on Architecture Diagram Skill’s interaction guidance.

Open **Guided walkthrough** above the diagram:

- Review all authored connections or just those around one component.
- Follow a numbered, horizontally scrollable step rail; selecting a number jumps directly to that connection. The current step number also appears on its highlighted arrow.
- Use Previous/Next, or Left/Right while focused in the player.
- Play advances every three seconds and stops at the last connection. Pause, close, hide the tab, or change the filter to stop it. Reduced-motion users get manual stepping.
- Read the current step, source → target endpoint boxes, connection label, and the other participating components together. Components outside the selected group are dimmed; evidence colors remain unchanged.
- While the walkthrough is open, click or press Enter/Space on a node to jump to its first selected connection. A node outside the selection produces explanatory feedback. Native diagrams also open the walkthrough when a node is activated.
- Download a companion Markdown explanation of the selected connections.

## Grounding and scope

This is a connection walkthrough, not a simulation. The order comes from the rendered diagram; it does not establish runtime execution, causality, or a deployment mode. Details come from authored labels and accessible node descriptions. No payloads, latency estimates, or environment variants are invented. The selector groups existing connections around a component; it does not create new business scenarios.

Archify already provides richer route/trace and presentation tools. Its controls continue to work when the walkthrough is closed. Opening Export closes the transient walkthrough so the exported diagram remains complete. Dragging nodes and deployment-mode toggles are not added by this integration; those require a separate authored layout/variant contract.

The architecture explorer keeps its existing multi-view navigation and evidence inspector. It is a separate output type, not one of these specialized renderers.

## Implementation

`lib/walkthrough/viewer.js` and `viewer.css` provide the shared offline player. Native desktop and mobile diagrams expose the same escaped node/connection attributes as Archify. `lib/renderers/walkthrough.mjs` embeds the fixed assets before delivery hashing. DOM text is assigned with `textContent`; no authored strings are executed as HTML or JavaScript.

Diago implements the walkthrough using authored connections and interaction ideas from the MIT-licensed Architecture Diagram Skill snapshot.

Regenerate existing artifacts with v0.8.1 to add the walkthrough. Convert lifecycle v1 and v2 JSON to v3 before rendering it. [Upgrade to v0.8.1](USAGE.md#upgrade-to-v081) · [Lifecycle migration guide](lifecycle-v3.md)

Security matrix and Fishbone use evidence registers instead of connection playback. They do not express a directed traversal or execution sequence.
