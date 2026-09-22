---
name: diago-update-upstreams
description: Update every upstream or base project pinned by the Diago repository, review and integrate compatible changes, validate the combined result, and merge it through the repository workflow. Use when the user asks to update Diago, sync all upstreams, refresh base projects, merge upstream changes, or prepare an upstream-based release. Do not use for ordinary npm dependency updates or diagram creation.
---

# Update Diago Upstreams

Refresh every source recorded in `vendor/upstreams.lock.json`, then integrate only reviewed, compatible changes into Diago. A successful run ends with every configured source reported as current and the combined repository passing validation.

## Repository Boundary

Work only in a writable Git checkout containing all of:

- `vendor/upstreams.lock.json`;
- `scripts/check-upstreams.mjs`;
- `scripts/sync-upstreams.sh`;
- `package.json` with the `upstreams:check` and `check` scripts.

Never edit an installed Codex plugin cache as the source repository. If the checkout is missing or read-only, report that boundary instead of mutating cached plugin files.

## Workflow

1. Inspect the primary checkout, every registered worktree, local and remote branches, remotes, and status. Preserve unrelated work. Fetch remote state and fast-forward the primary branch only; stop on divergence.
2. Create or reuse an isolated task worktree from the updated primary branch. Run `npm run check` before changing files and record any baseline failure.
3. Run the complete discovery check:

   ```bash
   npm run upstreams:check -- --json
   ```

   Compare its keys with every source in `vendor/upstreams.lock.json`. Stop if a configured source is omitted, the GitHub API fails, or the latest ref cannot be resolved. Do not describe a partial result as an all-upstream check.
4. For each source whose `changed` value is `true`, run the canonical sync sequentially:

   ```bash
   ./scripts/sync-upstreams.sh <source-name>
   ```

   Do not run source syncs in parallel because each updates the shared lock file and runs repository validation. Do not resync sources already reported current.
5. If the canonical clone fails, retry once. An archive or API fallback is acceptable only when it uses the exact discovered ref and full commit SHA, copies exactly the paths selected by `scripts/sync-upstreams.sh`, preserves executable modes, and verifies resulting Git blob identities. Otherwise stop without changing the pin.
6. Review each old-to-new upstream range before integrating it. Check:

   - license and attribution changes;
   - security-sensitive scripts, dependency behavior, and generated code;
   - schema, CLI, MCP, renderer, and standalone HTML compatibility;
   - methodology changes that affect Diago's evidence contract or quality gates;
   - removed, renamed, or newly required vendored files.
7. Keep vendored snapshots separate from canonical Diago behavior. Adapt relevant changes into `skills/`, `schemas/`, `lib/`, `mcp/`, documentation, or tests only when the upstream change is applicable and evidence supports the integration. Never copy methodology wholesale or silently change the public eight-type catalog.
8. Update `THIRD_PARTY_NOTICES.md` when a displayed pin or attribution changes. Update the changelog, package/plugin versions, release notes, tag, GitHub release, and installed Codex plugin only when the user also requests a release or plugin update.
9. Run the final gates:

   ```bash
   npm run check
   npm run upstreams:check -- --json
   ```

   Every source must report `changed: false`. Review `git diff --check`, the complete diff, and the staged diff. Stage only files belonging to the upstream integration.
10. Commit with a focused Conventional Commit, merge the task branch into the primary branch, rerun the final gates on the integrated result, clean up the task worktree and branch, and push only when authorized by the request or repository policy. Never force-push.

## Stop Conditions

Stop and report the exact source and state when:

- a license becomes incompatible or required attribution is unclear;
- upstream content cannot be tied to the discovered full commit SHA;
- a schema or renderer change breaks Diago compatibility;
- validation fails after focused integration work;
- primary or task history diverges or contains ambiguous user changes;
- authentication, branch protection, or network failure prevents safe completion.

Do not mark a source current by editing only its lock entry. Do not discard local work, bypass checks, or release a partially updated set as complete.

## Completion Report

Report one row per configured upstream with its old ref or commit, new ref or commit, and final `CURRENT` or blocked state. Include canonical Diago adaptations, validation results, task and integration commits, pushed branch, release/plugin status when requested, and any retained blocker.
