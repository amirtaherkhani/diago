# Evidence contract

## Source priority

Prefer runtime evidence and executable contracts over prose:

1. Deployed configuration, observed requests, logs, traces, and metrics.
2. Code paths, tests, generated API contracts, migrations, and infrastructure manifests.
3. Maintained design decisions and operational runbooks.
4. Tickets, chat, and unverified prose.

## Claim shape

Record each claim with:

- `statement`: one testable sentence;
- `kind`: `fact`, `assumption`, `recommendation`, or `superseded`;
- `source`: a file path, URL, command result, or explicit user statement;
- `confidence`: `high`, `medium`, or `low`;
- `scope`: the environment, version, branch, or time window.

If a source is stale or environment-specific, show that limitation in the diagram. If evidence conflicts, render the conflict as an open question rather than choosing silently. In public artifacts use repository-relative paths, public URLs, or semantic labels; never include local absolute paths.

## Sensitive data

Exclude credentials, tokens, customer data, internal hostnames, and production identifiers from public diagrams. Replace them with semantic labels while preserving the architecture boundary.

## Dependency-aware collection

For evidence spanning multiple modules or sources, split collection by independent questions. Inspect a producer's output contract before tracing consumers that depend on it; unrelated modules can be inspected concurrently with bounded concurrency. Use ordinary code for sorting, deduplication, and validation. Reuse the claim shape above for every result and retain source scope when combining results.

Combine results only where the reader's question requires them. Record unavailable evidence as an open question; a failed lookup never proves that a component or dependency is absent. Rerun only failed collection work, with at most one retry for a transient failure. Shared plan files and diagram outputs have one writer.

When depicting concurrent systems, draw dependency edges only when supported by a data or control contract. Distinguish conditional routes, joins that require all inputs, and paths that tolerate partial results. Preserve these semantics in the fidelity ledger when simplifying a graph. Diago visualizes the observed workflow; it does not execute or schedule agent fleets.

## Executable workflow planning

Use `plan_evidence_workflow` with a `workflow` matching the plugin-root `schemas/evidence-workflow.schema.json`, or run `node "${PLUGIN_ROOT:-$CLAUDE_PLUGIN_ROOT}/bin/diago.mjs" evidence <workflow.json> --json`. Start from `examples/checkout.evidence-workflow.json`.

Keep one coordinator as the snapshot writer. Evaluate the workflow, mark returned tasks as running before dispatch, and follow the host's authorization and delegation limits. Record elapsed time and structured results, then reevaluate after each completion. Do not wait for unrelated sources. Stop or confirm termination of timed-out work before using its retry slot; Diago accounts for timeouts but does not cancel workers. Persist the snapshot in the host workspace to resume it later.

Every reported claim needs a stable ID, statement, public source, verification verdict, and rationale. Use the same ID for the same claim across reviewers; mismatched statements or contrary verdicts become explicit conflicts. Verdicts are caller reports, not independent verification by Diago. Copy the returned `evidence` into the diagram plan only after reviewing `conflicts`, `rejected`, and `unresolved` and the workflow status. A terminal `incomplete` result is not an approved evidence set. Preserve the snapshot when reconciling a conflict so rejected evidence is not silently erased.
