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
