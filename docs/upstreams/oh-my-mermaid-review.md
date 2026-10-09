# Oh My Mermaid: source review and Diago integration

## Decision

Track [oh-my-mermaid](https://github.com/oh-my-mermaid/oh-my-mermaid) as a **methodology snapshot**. Its perspective selection, recursive decomposition, and source-path labels are useful references for Diago. Importing its runtime would add a different document model, browser server, cloud transport, and security boundaries that need separate engineering work.

Reviewed source: [`38ccdb69298adec949177c92c88d6e3ddfb5bab7`](https://github.com/oh-my-mermaid/oh-my-mermaid/tree/38ccdb69298adec949177c92c88d6e3ddfb5bab7), package version `0.2.0`, MIT license. Review date: 2026-10-09. This report describes that commit; subsequent upstream pins require a fresh review.

## Scope and verification

Inspected the CLI dispatcher and command implementations, public API, storage and metadata, diff/reference/validation code, cloud client and path resolver, all platform adapters, HTTP API, watcher, viewer parsing/layout/navigation code, three skills, manifests, build/release scripts, and test coverage. The supplied `.omm` examples demonstrate the same perspective tree described by the code.

- Installed upstream dependencies with `npm ci --ignore-scripts --no-audit --no-fund` in a separate review checkout.
- Upstream `npm test`: **37 tests passed in 8 files**.
- Upstream `npm run build`: ESM bundles and TypeScript declarations built successfully.
- Isolated temporary-directory probes confirmed local path escape, skipped nested validation, incorrect labeled-edge parsing, and missed node-label changes in the diff.
- Browser behavior below is source-reviewed, not a claim of browser visual QA. No global CLI installation, platform setup, login, cloud push/pull, or public sharing was performed. The cloud service implementation is not in this repository, so its authorization, privacy guarantees, and storage were not verified.

## Architecture and execution

```text
Host coding assistant + omm-scan instructions
  ↓ reads repository evidence and authors documentation
omm write <perspective>/<element> <field>
  ↓
.omm/ tree: Markdown + Mermaid text + YAML metadata
  ├─ CLI read / tree / refs / validate / diff
  ├─ HTTP JSON API → custom flowchart parser → Dagre → SVG viewer
  │                  ↑ file watcher → SSE refresh
  └─ explicit login / link / push / pull → external cloud API
```

The CLI does not autonomously analyze source code or call an LLM. The host assistant follows the scan skill, selects perspectives, reads files, and writes the generated fields. This distinction matters when assessing automation and factual accuracy.

| Area | Implementation |
|---|---|
| `src/cli.ts`, `src/commands/` | Manual command dispatch; document operations, viewer, configuration, platform setup, cloud commands |
| `src/lib/store.ts`, `meta.ts`, `types.ts` | Filesystem document tree and seven field names; previous diagram, timestamps, update counter, optional Git metadata |
| `src/lib/diff.ts`, `refs.ts`, `validate.ts` | Lightweight regex parsing, graph changes, `@name` links, convention checks |
| `src/server/` | Node HTTP server, read API, recursive file watcher, SSE, one HTML viewer |
| `src/lib/platforms/` | Claude marketplace commands, Codex/OpenClaw/Antigravity skill symlinks, Cursor project plugin copy |
| `skills/` | Scan, view, and cloud-push host instructions |
| `scripts/`, `.github/workflows/` | Version consistency and npm/GitHub release decisions |

Runtime requires Node 18+ and YAML. Development uses TypeScript, tsup, and Vitest. The viewer separately loads Dagre 0.8.5, unpinned Marked, and Google Fonts from the network. The package lock does not pin those browser resources. No database, queue, or MCP server is implemented in the reviewed repository.

## Features and actual limits

1. **Perspective-driven scanning.** Twelve suggested perspectives include overall architecture, request lifecycle, data flow, dependencies, external integrations, state transitions, routes, CLI commands, extensions, pipelines, orchestration, and storage. The host selects applicable perspectives.
2. **Recursive drill-down.** Each diagram node gets a description; components with meaningful internals get child diagrams. IDs match directory names. The stopping rule is semantic rather than a bounded execution budget.
3. **Seven document fields.** Description, diagram, context, constraint, concern, todo, and note. Files are Git-friendly; metadata retains one previous diagram rather than a complete history.
4. **Interactive exploration.** Nested groups, sidebar documentation, tree navigation, pan/zoom, mobile touch handling, dark/light themes, and progressive disclosure. Rendering recursion is capped at six levels; data loading is recursively eager.
5. **Mermaid subset.** Despite its name, the viewer uses a custom flowchart parser and Dagre, not the Mermaid rendering library. Full Mermaid syntax and sequence/state/ER rendering are not provided by this implementation.
6. **Validation and references.** Graph declaration, brackets, edge labels, palette conventions, node count, and reference existence/self-reference. These are syntax/convention heuristics, not proof that a diagram matches code.
7. **Cloud and agent integrations.** Explicit cloud commands exist, as do five platform adapters. `omm setup` modifies installation locations; `omm update` updates the global npm package then runs setup. These behaviors are separate from Diago upstream tracking.

## Important findings

Severity refers to potential runtime adoption, not to storing the selected Markdown snapshot.

| Severity | Finding and evidence | Impact / required treatment |
|---|---|---|
| High | [Store path construction](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/lib/store.ts#L60) joins unvalidated class/node paths; deletion uses recursive removal. A temporary probe wrote `../outside/description.md` outside `.omm`. | Reject traversal, invalid segments, and symlink escapes before read/write/delete. CLI caller control is the observed entry point; remote arbitrary file access was not established. |
| High | [Viewer sidebar](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/server/viewer.html#L1083) inserts `marked.parse` output through `innerHTML`, without sanitization. Metadata and inline event-handler contexts also need escaping review. | Untrusted documentation can introduce active HTML. Sanitize or render safe DOM; remove inline handlers and use a restrictive CSP before reuse. |
| High | [HTTP listener](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/server/index.ts#L70) has no loopback host binding; [API responses](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/server/api.ts#L6) allow wildcard CORS without authentication. | Architecture documents may be exposed to reachable clients. Bind loopback and enforce origin/authentication boundaries where appropriate. |
| Medium | [Viewer cache](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/server/viewer.html#L1438) stores both scoped paths and shared short names; recursive rendering resolves short names. | Identical child names across perspectives can overwrite each other; use fully scoped identities throughout. |
| Medium | The same cache survives SSE `init()` calls; child loaders return cached data, and `init()` registers another message listener. | Nested edits/removals may stay stale and message handlers can accumulate. Reset/version caches and register listeners once. |
| Medium | [Diff parser](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/lib/diff.ts#L12) is distinct from the viewer parser. Probe: `A -->\|calls\| B` becomes edge `A --> \|calls\|`; changing only a node label reports no change. | Use one tested grammar or normalized graph IR before adopting semantic change detection. |
| Medium | [Validate-all](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/commands/validate.ts#L31) iterates top-level classes only. A malformed child passed the all-documents command but failed explicit child validation. | Walk every nested document and report complete coverage. |
| Medium | [Store writes](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/lib/store.ts#L126) update content, prior content, and parent metadata using separate synchronous writes without locks. Nested writes omit the Git metadata path used by top-level writes. | Concurrent agents can lose updates or leave inconsistent metadata. Use ownership/serialization and atomic writes; unify provenance handling. |
| Medium | [Cloud pull path guard](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/lib/cloud-paths.ts) blocks lexical traversal, but does not establish symlink containment; pull overwrites files incrementally. Push walks all files without a field allowlist. | Add realpath/symlink checks, bounded payload validation, explicit file selection, and transactional conflict-aware writes before cloud reuse. |
| Medium | [Cloud requests](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/lib/cloud.ts#L84) lack request deadlines; the [login callback](https://github.com/oh-my-mermaid/oh-my-mermaid/blob/38ccdb69298adec949177c92c88d6e3ddfb5bab7/src/commands/login.ts#L21) accepts a token without a state nonce and uses a shell command to open the configured URL. | Add timeout/cancellation, callback state and loopback binding, and argument-based browser launch. Credential files are created with mode 0600, which is a positive baseline. |
| Medium | Viewer eagerly loads one request per child plus top-level metadata/reference requests; filesystem reads/layout are synchronous. | Large repositories need bounded loading and lazy expansion. No performance benchmark was run. |
| Low | The scan skill asks for broad recursion and six narrative fields without Diago's fact/assumption/fidelity contract. The push skill uses `omm share` as a login check, but that command does not check a token. | Adapt useful ideas into Diago's existing evidence workflow; do not activate upstream instructions wholesale. |

## What Diago should reuse

| Idea | Compatible application | Boundary |
|---|---|---|
| Perspective selection | Choose overview, request flow, data movement, or another question from inspected evidence | Preserve one primary question and the existing eight renderer types |
| Recursive component analysis | Produce bounded overview/detail plans for components with distinct responsibilities | Use scoped IDs, depth/node budgets, dependency-aware evidence tasks, and explicit stopping criteria |
| Source-path labels | Make each component traceable to files and code paths | Preserve citations and separate verified facts from assumptions; a path label alone is not proof |
| Incremental documentation | Compare source ownership/provenance before revisiting a detail view | Require a reliable graph/schema diff and conflict handling before implementation |

These are adoption recommendations, not newly implemented renderer or scanner features.

## Integration delivered

- Lock source `oh-my-mermaid`, tracking `main`, mode `methodology-snapshot`.
- Exact upstream copies of `LICENSE`, `README.md`, and `skills/omm-scan/SKILL.md` under `vendor/oh-my-mermaid/`.
- Canonical sequential sync command, read-only update discovery, weekly CI matrix entry, required-file validation, attribution, and documentation.
- The vendored scan skill remains reference material outside Diago's active `skills/` directory. No upstream CLI/server/cloud code or npm dependency is imported.

Future updates must review changes to scan instructions and upstream runtime findings before promoting any behavior into canonical Diago skills. Current snapshot identity is authoritative in `vendor/upstreams.lock.json`.
