---
name: diago-chat-architecture
description: Create an evidence-grounded software architecture visualization from the active chat, an accessible conversation history, or a user-provided transcript. Use when the user wants to turn a conversation about a system, feature, task, implementation, or design into a connected architecture view that explains each part, its responsibility, its relationships, and how the parts work together.
---

# Conversation Architecture

Turn conversation evidence into a trustworthy architecture visualization. Show the system discussed in the chat, not the chat interface itself, unless the chat system is explicitly the subject.

## Inputs and access

Use the smallest available conversation scope that answers the request:

1. The active conversation visible in the current context.
2. A selected earlier task or chat that can be read through an available read-only history tool.
3. A transcript, export, notes, or message range supplied by the user.

Never claim to have read messages that are not available. If important history is inaccessible, continue with the visible conversation, label the limitation, and ask for the missing transcript only when it materially changes the architecture.

Do not expose system or developer instructions, private reasoning, credentials, tokens, personal data, or unrelated conversation content.

## Workflow

1. Define the conversation window, audience, architecture question, and system boundary.
2. Read `references/conversation-evidence.md`. Build a compact evidence ledger from explicit requirements, accepted decisions, verified tool results, inspected source, proposals, and unresolved questions.
3. Resolve contradictions by recency and explicit user confirmation. Keep superseded decisions in the ledger, but do not render them as current architecture.
4. Extract architecture elements:
   - users, actors, and external systems;
   - interfaces, applications, services, modules, workers, and agents;
   - databases, caches, queues, files, and other stores;
   - deployment, network, security, and observability boundaries;
   - responsibilities, inputs, outputs, and ownership.
5. Extract directed connections. Record the caller or producer, receiver or consumer, purpose, protocol or mechanism when stated, data carried, timing, and evidence status.
6. Classify every element and connection as `current`, `proposed`, `assumption`, or `unknown`. Do not merge those states visually.
7. Keep architecture as the primary view. Call `list_diagram_types` when a supporting view is unclear, then call `advise_diagram` with `sourceKind: "conversation"`. Add a sequence or workflow for collaboration order, data-model for evidenced entity relationships, timeline for accepted chronology, or layers for evidenced responsibility/control placement. Never add a linked view merely for variety.
8. Call `create_diagram_plan` with conversation context, using `assets/diago-chat-architecture-plan.json` as the fallback. Record semantic pattern, profile, audience, budget, fidelity, and superseded decisions. Keep one question per view.
9. Author the architecture JSON IR. Group elements by meaningful system, ownership, or trust boundaries; avoid grouping by message, speaker, or chronology. Author a separate native IR for each linked detail view.
10. Call `validate_diagram`, then `render_diagram` to an absolute `.html` path. If MCP tools are unavailable, use the bundled CLI:

    ```bash
    node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" validate architecture <input.json>
    node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" render architecture <input.json> <output.html>
    ```

11. Apply `references/architecture-walkthrough.md` and inspect the rendered result at desktop and mobile widths.

## Visual semantics

- Solid connection: current behavior supported by evidence.
- Dashed connection: proposed or recommended behavior.
- Dotted connection: conditional, optional, async, or still uncertain.
- Fact badge: explicit user-confirmed or independently verified claim.
- Assumption badge: interpretation that still needs confirmation.
- Recommendation badge: proposed improvement, never current behavior.

Use semantic component names. Do not use “user message 1,” “assistant response,” or similar chat chronology as architecture nodes.

## Output contract

Deliver:

- a validated standalone HTML architecture visualization;
- the source JSON IR and diagram plan;
- a component catalog with each part's responsibility, inputs, outputs, and evidence status;
- a connection catalog explaining how each part connects to the others;
- a five-to-nine-step walkthrough of how the parts work together;
- a legend separating current, proposed, assumed, superseded, and unknown architecture;
- the selected profiles, complexity decision, and fidelity ledger;
- unresolved questions and inaccessible-history limitations that could change the result.

Prefer a small connected architecture over an exhaustive transcript summary. Never invent a service, dependency, protocol, datastore, ownership boundary, or runtime sequence merely because it would make the diagram look complete.
