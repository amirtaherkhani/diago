# Architecture walkthrough

## Required component checks

For every important component, make clear:

- its responsibility and ownership boundary;
- what it receives and produces;
- which components it depends on;
- whether it is current, proposed, assumed, or unknown;
- which conversation or external evidence supports it.

## Required connection checks

Every connection must have:

- a visible direction;
- a purpose or action label;
- a protocol, event, or data mechanism when known;
- a visual state matching its evidence;
- no unsupported intermediary component.

Avoid crossing lines where possible. Group by system, deployment, trust, or ownership boundary rather than by speaker or message order.

## Collaboration walkthrough

Explain the main path in five to nine numbered steps:

1. Identify the initiating actor or trigger.
2. Follow each directed handoff.
3. Explain what responsibility each receiving component performs.
4. Identify important data written, transformed, or emitted.
5. Show async, retry, timeout, and failure paths only when supported.
6. End at the observable result or terminal state.

If one architecture view cannot explain ordering cleanly, create a companion sequence view instead of overloading edge labels.
