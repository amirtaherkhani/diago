# Diago usage guide

[← Back to the README](../README.md)

## Connect the MCP server directly to Codex

Register Diago as a native stdio MCP server:

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago
codex mcp add diago -- node "$PWD/mcp/server.mjs"
codex mcp get diago
```

Restart the Codex app or open a new Codex session after registration. The Codex app, CLI, and IDE extension share this MCP configuration.

## Connect the MCP server directly to Claude Code

Register the same bundled stdio server in Claude Code:

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago
claude mcp add --transport stdio diago -- node "$PWD/mcp/server.mjs"
claude mcp get diago
```

Diago supports the standard local stdio MCP transport for Codex and Claude Code. It does not require a cluster, HTTP endpoint, bearer token, or API key.

## Use after installation

Open the repository you want to explain, start a new Codex or Claude Code thread, and describe the engineering decision you need to make. You can provide a prompt, a project, the active conversation, selected chat history, or mixed evidence. Diago records that source boundary, selects the smallest useful view, separates verified facts from assumptions, recommendations, and superseded decisions, validates the diagram, and renders a standalone HTML artifact.

For Codex, mention the skill directly:

```text
Use $diago-engineering-diagram to map this feature from its API entry point to persistence. Inspect the code, separate facts from assumptions, and render architecture and sequence views.
```

For Claude Code, invoke the namespaced skill and then provide the task:

```text
/diago:diago-engineering-diagram
Map this feature from its API entry point to persistence. Inspect the code, separate facts from assumptions, and render architecture and sequence views.
```

### Example prompts

**Feature architecture**

```text
Use $diago-engineering-diagram to map this feature from its API entry point to persistence. Show ownership boundaries, external dependencies, and the request sequence.
```

**Design pattern**

```text
Use $diago-engineering-diagram to evaluate whether the Strategy pattern fits this task. Show the current coupling, proposed objects, tradeoffs, and where the pattern should not be used.
```

**Best-practice rollout**

```text
Use $diago-engineering-diagram to find the safest workflow for rolling out this schema change. Show owners, validation gates, failure paths, rollback steps, and the evidence for each recommendation.
```

**Lifecycle or incident flow**

```text
Use $diago-engineering-diagram to visualize this background job lifecycle, including retries, timeouts, recovery paths, and terminal states.
```

**Review an existing diagram**

```text
Use $diago-review-diagram to audit this diagram against the repository. List unsupported claims, missing boundaries, ambiguous edges, and visual issues, then recommend focused corrections.
```

**Architecture from the active conversation**

```text
Use $diago-chat-architecture to turn this conversation into a software architecture visualization. Show every important component, what it owns, how it connects to the other parts, and how the parts work together. Separate current behavior, proposals, assumptions, and unresolved questions.
```

**Architecture from selected chat history**

```text
Use $diago-chat-architecture to visualize the architecture discussed in the supplied conversation history. Reconcile later decisions with earlier proposals, show component responsibilities and directed connections, and add a sequence view when ordering is important.
```

**Domain data model**

```text
Use $diago-engineering-diagram to inspect this repository's order domain and render a data-model view. Show verified entities, keys, constraints, cardinality, and proposed schema changes without inventing missing relationships.
```

**Migration timeline**

```text
Use $diago-engineering-diagram to turn this migration plan and repository evidence into an engineering timeline. Show phases, dependencies, owners, validation gates, and rollback milestones; use ordered phases when dates are not confirmed.
```

**Architecture layers and controls**

```text
Use $diago-engineering-diagram to show where authentication, authorization, validation, observability, and data-protection controls are enforced across this system's layers. Mark gaps and unsupported assumptions explicitly.
```

In Claude Code, replace `$diago-engineering-diagram` with `/diago:diago-engineering-diagram`, `$diago-chat-architecture` with `/diago:diago-chat-architecture`, and `$diago-review-diagram` with `/diago:diago-review-diagram`.


## How it works

```text
task or feature
      │
      ▼
source evidence ──► diagram plan ──► diagram JSON IR ──► validated HTML
      ▲                   │                                  │
      └──────────── review findings ◄────────────────────────┘
```

New plans use schema v2. The contract preserves evidence lanes and adds the input source, audience, selection rationale, complexity budget, decomposition decision, and fidelity ledger. This compact excerpt highlights the new fields; the linked examples below contain complete, reviewable plans:

```json
{
  "schemaVersion": 2,
  "source": { "kind": "repository", "scope": "main", "references": ["src/checkout"] },
  "audience": { "role": "backend engineers", "detail": "technical" },
  "selection": {
    "semanticPattern": "trust-boundary-routing",
    "renderer": "architecture",
    "profile": "feature-context"
  },
  "evidence": {
    "facts": [{ "statement": "The API requires an idempotency key.", "source": "openapi.json" }],
    "assumptions": [{ "statement": "Reservations expire.", "source": "product confirmation needed" }],
    "recommendations": [{ "statement": "Persist replay results.", "source": "toolkit guidance" }],
    "superseded": []
  },
  "complexity": { "detail": "balanced", "decomposition": "single" },
  "fidelity": { "merged": [], "collapsed": [], "omitted": [], "preserved": [] }
}
```

Legacy schema-v1 plans remain reviewable through non-mutating compatibility normalization; newly generated plans are v2. See [`schemas/diagram-plan.schema.json`](../schemas/diagram-plan.schema.json), the [checkout plan](../examples/checkout-feature.diagram-plan.json), the [repository plan](../examples/repository-domain.diagram-plan.json), the [conversation plan](../examples/conversation-architecture.diagram-plan.json), and the native [data model](../examples/order-domain.data-model.json), [timeline](../examples/payment-migration.timeline.json), and [layers](../examples/checkout-controls.layers.json) examples.

## Evidence workflows

Available in Diago v0.7.0. Update an older plugin installation to use `plan_evidence_workflow`, or run the CLI from a v0.7.0 source checkout. Updating repository files alone does not update an installed plugin.

Use `diago evidence` or the read-only `plan_evidence_workflow` MCP tool when a diagram needs evidence from independent sources and dependent cross-checks:

```bash
node bin/diago.mjs evidence examples/checkout.evidence-workflow.json --json
```

The planner returns up to the configured number of ready tasks. The host inspects sources, records attempts and verification verdicts in the JSON snapshot, then evaluates it again. Failed branches retain their errors while independent work continues; only explicit retryable failures and timeouts get another attempt. Conflicting claims stay out of the plan's facts.

See [the workflow guide](./evidence-workflows.md) for the snapshot contract, concurrency and timeout handling, evidence reconciliation, and a complete example. Source inspection and verification are performed by the host: Diago neither launches workers nor independently proves the reported claims.

### Follow the workflow result

1. Evaluate the snapshot and dispatch only tasks listed in `ready`, within the host's authorization and concurrency limits.
2. Mark dispatched tasks running, record elapsed time, then record their final outcome and source-backed claim verdicts.
3. Reevaluate after each completion. Only nodes whose dependencies succeeded become eligible; independent branches can continue after another branch fails.
4. Review `conflicts`, `rejected`, and `unresolved` before transferring the returned evidence to a diagram plan. The host verifies sources and stops expired workers before retrying them.

| Report status | CLI exit | Next action |
|---|---|---|
| `pending` | 0 | Run ready work or update running attempts |
| `complete` | 0 | Review reported evidence, then prepare the diagram plan |
| `incomplete` | 1 | Resolve failed tasks or conflicting evidence |
| Invalid input | 2 | Correct the workflow contract or dependency graph |

Exit 0 alone does not mean the evidence is complete. `ok: true` describes consistency of the supplied reports; it is not independent source verification.

## Dependency updates

The scheduled dependency workflow checks pinned sources every week. Each update is isolated in a reviewable pull request with checks for:

- license and security changes;
- schema and rendering compatibility;
- evidence semantics and visual quality;
- the complete `npm run check` suite.

Run the read-only check locally:

```bash
npm run upstreams:check
```

The checker reads every configured source with at most four concurrent GitHub requests and a 15-second timeout per request. It preserves lockfile order and successful results when another source fails. With `--json`, successful entries keep `current`, `latest`, and `changed`; failed entries return `latest: null`, `changed: null`, and an `error` message. Any failed check exits with status 1, so partial discovery cannot be treated as a complete check. Snapshot synchronization remains sequential because it writes the shared lockfile.

Archify updates track its `main` branch, including changes newer than the latest release tag. Each synchronization records the exact copied commit in `vendor/upstreams.lock.json`; the bundled runtime may still report the last upstream release version.

Dependency updates never silently rewrite the canonical skills.
