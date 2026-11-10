# Diago project rules

## Finish merged work

Read and apply the [Diago post-merge cleanup skill](.agents/skills/diago-post-merge-cleanup/SKILL.md) when finishing an authorized Diago merge or handling an explicit request to clean up merged work.

After verifying integration and the applicable checks, finish cleanup of the task-owned worktree and branch refs as part of the task. Remove each eligible target without waiting for another reminder. Verify remote integration before deleting the remote task branch. If a target is blocked, report the exact path or ref and the reason, then finish any independent cleanup that is safe.

Honor task-specific holds and repository protections. Bulk cleanup requires an explicit request. This workflow authorizes no additional release or tag actions.
