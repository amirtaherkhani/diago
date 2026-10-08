# v0.6.0

## Highlights

Diago now bundles Archify v3.0.1 and provides an upstream-update skill. Source discovery checks independent repositories concurrently, preserves successful results when a source fails, and reports incomplete checks explicitly.

## Added

- Upstream-update skill for complete discovery, sequential snapshot synchronization, compatibility review, and verified repository integration.

## Changed

- Upgraded bundled Archify from v2.16.0 to v3.0.1, including its viewer, rendering, and output-handling changes.
- Refreshed UI UX Pro Max and Diagram Design methodology snapshots and third-party notices, including the bundled JetBrains Mono font license.
- Added guidance for dependency-aware evidence collection, checking contradictory evidence, and bounded repair loops.

## Performance

- Upstream discovery runs up to four independent GitHub requests concurrently, with a 15-second timeout per request.

## Fixed

- Failed upstream checks retain successful source results and exit nonzero. Empty configurations, malformed refs, and invalid commit SHAs are rejected.

## Configuration

- Successful upstream JSON entries retain their existing fields. Failed entries contain `latest: null`, `changed: null`, and an `error` message. Consumers must check the exit status and must not interpret `changed: null` as current.

[Full comparison](https://github.com/amirtaherkhani/diago/compare/v0.5.0...v0.6.0)
