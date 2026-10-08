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
