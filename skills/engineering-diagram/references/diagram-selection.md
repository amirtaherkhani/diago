# Diagram selection

Choose the view from the question, not from the nouns in the task.

| Question | Primary type | Typical evidence |
| --- | --- | --- |
| What exists and who depends on it? | architecture | modules, deployments, routes, ownership |
| What happens over time between participants? | sequence | calls, messages, retries, responses |
| Which steps and decisions control the work? | workflow | branches, approvals, failure paths |
| Where does data originate, transform, and land? | dataflow | schemas, events, stores, retention |
| How does one entity change state? | lifecycle | state machine, guards, transitions |

Use two linked views when one question cannot carry both structure and time. Prefer architecture plus sequence for a feature, architecture plus dataflow for analytics, and workflow plus lifecycle for operational processes.

Avoid a single "everything diagram." Split by audience or decision when labels need paragraphs, edges cross repeatedly, or more than nine walkthrough steps are required.
