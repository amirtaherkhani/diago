---
name: diago-post-merge-cleanup
description: Use when finishing a verified Diago task merge or explicitly asked to clean up merged Diago worktrees and branches.
---

# Diago post-merge cleanup

Finish the authorized task by removing its eligible worktree, local branch, and remote branch. A linked worktree lives on its execution host. A remote branch is a separate Git ref.

## Identify and verify the task

Run each command only after its conditions hold. Assign the variables from verified values before use. `primary_checkout` and `task_worktree` are absolute paths. `primary_ref` and `task_ref` are full remote branch refs under `refs/heads/`. `primary_remote` and `task_remote` are verified remote names. `task_branch` is the local branch name and `reviewed_tip` is the full SHA.

1. Verify the Diago repository, actual primary branch, remote URLs, exact task branch, reviewed task tip, and registered worktree path. Use `git -C "$primary_checkout" worktree list --porcelain` and `git -C "$primary_checkout" branch -avv`. Account for each host involved. Preserve the primary branch, maintained release branches, tags, and unrelated or unknown work. Classify a temporary release-preparation branch by its ownership and integration proof.
2. Fetch and prune each verified remote with `git -C "$primary_checkout" fetch --prune "$primary_remote"` and the same command for `"$task_remote"` if distinct. Recheck the primary checkout and its relationship to remote primary before classifying the merge. If local primary is behind, update it only by fast-forward from the fetched primary and only if the checkout is safe. If primary has diverged, stop and report the divergence.
3. Confirm the required checks passed for the integrated result. For a normal merge, prove the reviewed task tip is an ancestor of the integrated primary commit with `git merge-base --is-ancestor` from the primary checkout. For squash or rebase, verify the merged PR, its reviewed head SHA, and the corresponding integrated diff on the intended primary branch. Verify the original tip and any needed artifacts will remain recoverable. Retain targets with uncertain ownership, integration, or recovery.
4. Inspect each task checkout for staged, unstaged, untracked, and ignored files, submodules, nested repositories, and active Codex tasks or other processes. Use `git -C "$task_worktree" status --short --untracked-files=all --ignored` and inspect reported paths and nested repositories. Preserve user data and any unique or ambiguous work. Check for shared refs, open PRs that depend on the ref as a head or base, and active checkout dependencies before deleting a branch.

## Clean up in order

1. Set the command working directory to the retained primary checkout before removing the clean, inactive task worktree through the supported host action. For an ordinary linked Git worktree, use:

   ```bash
   git -C "$primary_checkout" worktree remove "$task_worktree"
   ```

   Verify the path is absent from `git -C "$primary_checkout" worktree list --porcelain`. If Codex refuses to archive an active checkout with “The task's primary checkout cannot be removed.”, retain it and report the exact path and error. Do not bypass that refusal with Git or filesystem removal.

2. Verify the local branch still points to the reviewed tip and is free of checkout and task dependencies. Delete it from the primary checkout:

   ```bash
   git -C "$primary_checkout" branch -d -- "$task_branch"
   ```

   If safe deletion refuses, retain the branch. For separately authorized branch cleanup after a Codex archive refusal, a clean active checkout can stay at the same reviewed tip with detached HEAD. First verify it is on the task branch at that tip, the exact commit is reachable from fetched remote primary, and no other actor needs the branch. Use `git -C "$task_worktree" switch --detach "$reviewed_tip"`, verify the checkout stayed at the same commit with the same contents, then run the branch deletion from the primary checkout. Report the worktree as retained.

3. If primary still needs publication, recheck the primary checkout and remote tip. Publish only the verified integration and follow branch protection. A verified PR merge into remote primary already satisfies publication. For a permitted direct push:

   ```bash
   git -C "$primary_checkout" push "$primary_remote" "$primary_ref:$primary_ref"
   ```

   If publication fails, preserve the remote task branch.

4. Fetch the verified primary ref with `git -C "$primary_checkout" fetch "$primary_remote" "$primary_ref"` and repeat the integration proof against the fetched commit. Read the live task ref immediately before deletion:

   ```bash
   git -C "$primary_checkout" ls-remote --refs "$task_remote" "$task_ref"
   ```

   If the exact ref is already absent, skip deletion. If its SHA differs from the reviewed tip, access fails, or the ref is protected, shared, or still in use, retain it. Delete only the verified remote task ref:

   ```bash
   git -C "$primary_checkout" push --delete "$task_remote" "$task_ref"
   ```

   After successful deletion, run `git -C "$primary_checkout" fetch --prune "$task_remote"`. Use normal, non-forcing operations. Keep Git history and release refs intact.

## Verify completion

Recheck the worktree inventory and live remote task ref from the primary checkout using the commands above. Check the exact local ref with `git -C "$primary_checkout" show-ref --verify --quiet "refs/heads/$task_branch"` and confirm remote primary still contains the integration. A successful live remote query with no matching ref proves absence. A failed query leaves the state unknown. Report each removed, already absent, or retained target and give the reason for any retained target. Continue independent eligible cleanup when one target is blocked. Do not create a cleanup-only commit.
