# Revert Unstaged Changes

## Goal
Discard all **unstaged** working-tree modifications in the repo, returning tracked files to their last committed state. Abandons the in-progress (uncommitted) edits from prior discussion.

> **Execution requires Execute mode.** `git restore` / `git checkout` modify the working tree, which plan mode blocks. Re-enter Execute mode to run the revert.

## Scope
- **Revert:** unstaged changes to tracked files (e.g. the leadership-listing / leadership-list-cf / header / MSM edits that were left uncommitted).
- **Preserve:** committed history (no commits are touched) and — unless you say otherwise — untracked files (new files not yet added) and the `.migration/plans/*` artifacts.

## Approach
1. **Show first (safety):** `git status` + `git diff --stat` to list exactly what would be discarded — so nothing unexpected is lost.
2. **Revert tracked, unstaged changes:** `git restore .` (a.k.a. `git checkout -- .`) to reset modified tracked files to HEAD.
3. **Do NOT** touch: staged changes (none expected), commits, or untracked files (no `git clean`) unless explicitly requested.
4. **Verify:** `git status` shows a clean tree for tracked files.

## Risks
- **Destructive & irreversible** for uncommitted edits — the working-tree changes are not recoverable once discarded. Showing status first mitigates surprise.
- If any of those edits are still wanted, this is the point of no return; confirm before running.

## Checklist
- [ ] (Execute mode) Run `git status` + `git diff --stat` to enumerate unstaged changes
- [ ] Run `git restore .` to discard unstaged changes to tracked files
- [ ] Leave untracked files and commits untouched (no `git clean`, no reset of history)
- [ ] Confirm with `git status` that the tracked working tree is clean

### Execution Note
- [ ] Re-enter **Execute mode** to perform the revert. I'll list what will be discarded before running the destructive step.
