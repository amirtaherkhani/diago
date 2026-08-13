# Diagram selection

Choose the view from the question, not from the nouns in the task.

| Question | Primary type | Typical evidence |
| --- | --- | --- |
| What exists and who depends on it? | architecture | modules, deployments, routes, ownership |
| What happens over time between participants? | sequence | calls, messages, retries, responses |
| Which steps and decisions control the work? | workflow | branches, approvals, failure paths |
| Where does data originate, transform, and land? | dataflow | event contracts, transformations, stores, retention |
| How does one entity change state? | lifecycle | state machine, guards, transitions |
| Which entities, fields, constraints, and relationships define the domain? | data-model | migrations, schema, entity definitions, cardinality |
| Which engineering milestones occur, and in what temporal relationship? | timeline | release evidence, migration phases, incident timestamps |
| Where are responsibilities, abstractions, controls, or defenses enforced? | layers | module boundaries, dependency rules, policy controls |

## Profiles

- Architecture: feature context, system context, deployment topology, trust boundary, design pattern.
- Sequence: request walkthrough, integration exchange, async retry, failure compensation.
- Workflow: decision flow, swimlane, delivery process, incident response.
- Dataflow: event lineage, transformation pipeline, queue bottleneck.
- Lifecycle: state machine, job lifecycle, retry recovery.
- Data model: domain model, persistence schema, event model.
- Timeline: delivery roadmap, migration plan, incident timeline, release history.
- Layers: application layers, platform stack, control enforcement, defense layers.

Use two linked views when one question cannot carry both structure and time, model and behavior, or ownership and enforcement. Prefer architecture plus sequence for a feature, architecture plus dataflow for analytics, data-model plus lifecycle for an entity, architecture plus layers for control placement, and timeline plus workflow when chronology and decision gates are both essential.

## Balanced ceilings

| Type | Ceiling |
| --- | --- |
| Architecture | 12 components, 16 connections, 4 boundaries |
| Sequence | 6 participants, 16 messages, 2 conditional segments |
| Workflow | 5 lanes, 12 steps, 16 edges |
| Dataflow | 6 stages, 12 nodes, 16 flows |
| Lifecycle | 12 states, 16 transitions |
| Data model | 8 entities, 12 relationships |
| Timeline | 12 milestones, 4 tracks |
| Layers | 7 layers, 24 responsibilities |

Avoid a single "everything diagram." Split by audience or decision when a ceiling is exceeded, labels need paragraphs, edges cross repeatedly, or more than nine walkthrough steps are required. If prose, a table, or a checklist answers the engineering decision more clearly, recommend that instead of forcing a diagram.
