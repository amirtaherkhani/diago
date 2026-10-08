# Evidence workflows

Diago evaluates a dependency graph of evidence tasks and returns what the host can run next. It is a deterministic, read-only planner: it performs no source reads, network calls, agent launches, cancellation, or background execution. The caller owns source inspection, independent verification, timekeeping, and snapshot persistence.

## Availability

Available in Diago v0.7.0 through the plugin's `plan_evidence_workflow` MCP tool and the CLI. Update an older plugin installation, or run the CLI from the repository root of a v0.7.0 checkout. See the [release notes](./releases/v0.7.0.md).

## Start

```bash
node bin/diago.mjs evidence examples/checkout.evidence-workflow.json --json
```

For MCP, call `plan_evidence_workflow` with `{ "workflow": <snapshot> }`. Both entry points return the same report.

```text
API inspection ───────┐
                      ├─ Contract verification
Storage inspection ───┘
```

The example exposes `api` and `storage` together. `verify` becomes ready only when both inspections report success. An unrelated branch can progress as soon as its own dependencies succeed.

## Snapshot contract

See [`evidence-workflow.schema.json`](../schemas/evidence-workflow.schema.json).

| Field | Meaning | Default / limit |
|---|---|---|
| `schemaVersion` | Workflow format | `1` |
| `concurrency` | Running tasks plus newly offered tasks | Default 3; 1–4 |
| `maxAttempts` | Total attempts per node, including the first | Default 2; 1–3 |
| `timeoutMs` | Time budget per attempt | Default 15000; 1–300000 |
| `nodes` | Bounded questions with unique IDs and dependency IDs | 1–32 nodes |
| `attempts` | Ordered history for one node | Up to `maxAttempts` |

Each node contains `id`, `question`, `dependsOn`, and `attempts`. Dependencies must exist and form an acyclic graph. Each attempt has `status` and integer `elapsedMs`. Status can be `running`, `succeeded`, `failed`, or `timed-out`.

- A `succeeded` attempt includes 1–20 claims and no failure fields.
- A `failed` attempt includes a public `error` and explicit boolean `retryable`.
- A `running` or `timed-out` attempt has no claims or failure fields.
- A live or successful attempt at or beyond the time budget is treated as timed out; late claims are excluded. A reported permanent failure remains permanent even when late.
- Only timeouts and explicitly retryable failures may precede another attempt. Successful work is never automatically retried.

Mark selected tasks as running **before** dispatch. Update their elapsed time while running, replace the running entry with its final outcome, and append a new entry only when actually retrying. The planner offers work but does not reserve slots. Use one writer for each workflow; the host must stop timed-out workers before starting replacements. Repeated evaluation of an unchanged snapshot returns the same tasks.

The host must persist the complete snapshot and preserve prior attempts. Diago validates snapshot consistency; it cannot authenticate the history or enforce limits across manually reset snapshots.

## Report a verified inspection

After inspecting a source and checking the claim, replace the corresponding running attempt with a result such as:

```json
{
  "status": "succeeded",
  "elapsedMs": 800,
  "claims": [
    {
      "id": "order-write",
      "statement": "The API persists the order before returning success.",
      "source": "src/orders.mjs:42",
      "verdict": "supported",
      "reason": "The handler awaits the repository write before producing the response."
    }
  ]
}
```

This is an illustrative report, not a claim about Diago's implementation. The verifier must actually inspect the cited source. Allowed verdicts are `supported`, `unverified`, and `contradicted`. Keep claim IDs stable across sources reviewing the same assertion. A succeeded inspection means the task ran successfully; it can still report contradicted or uncertain claims.

Diago groups reports by claim ID and preserves their source and rationale. Identical statement/source pairs are deduplicated. Different statements under one ID, or both supported and contradicted verdicts, create a conflict. Contradicted claims go to `rejected`; uncertain claims go to `unresolved` and the plan's assumptions. Any uncertainty within a claim group prevents that group from becoming facts. Matching supported reports become plan-compatible facts with each distinct citation retained.

The comparison is structural, not semantic: different claim IDs are not automatically recognized as contradictory. A host must assign consistent IDs and perform semantic verification. Preserve failed or rejected evidence when reconciling reports instead of relabeling it solely to pass a gate.

## Consume the result

The result includes `ready`, all node states, `limits`, plan-compatible `evidence`, and `conflicts`, `rejected`, and `unresolved` report groups.

| `status` | Meaning | CLI exit |
|---|---|---|
| `pending` | Runnable, waiting, or running work remains | 0 |
| `complete` | All nodes succeeded and supplied claim reports are consistent | 0 |
| `incomplete` | Work is terminal with failures, blocked tasks, or unresolved evidence | 1 |
| Invalid input | Malformed contract, cycle, or inconsistent attempts | 2 |

`ok` is true only for `complete`. Read status even when the CLI exits 0. MCP input errors return `isError: true`; a valid but incomplete report is structured data with `ok: false`.

Inspect unresolved report groups and failed node reasons before transferring `evidence` into a schema-v2 diagram plan. Copy only after source verification and intentional reconciliation; then run the existing plan review and renderer validation. The original plan schema, eight-renderer catalog, and rendering commands remain compatible.
