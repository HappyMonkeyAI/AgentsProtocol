---
name: isolated-worktree-handoff
description: Use when parallel agents or clean history need isolation. Set up ag/ worktrees, context packs, evidence handoffs; never clobber dirty trees.
---

# Isolated worktree and evidence handoff

Operationalizes [ADR-0002](../../docs/adr/0002-isolated-worktrees-and-evidence-handoffs.md). Complements [ADR-0001](../../docs/adr/0001-verification-ladder-and-owner-adversary.md) Owner acceptance.

Upstream pattern: [ai-agent-teamwork-prompt](https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt) (worktree + branch mode).

## When to use

- Parallel Workers on one repo
- Clean, reviewable branch history required
- Orchestrator selected **branch / worktree mode**
- Delegating implementation to a sub-agent / external CLI

## When not to use

- Solo Quick Mode on an already-correct branch with no parallel writers
- Read-only reconnaissance
- Shared-checkout rapid swarm **with** working file locks and non-overlapping claims (still use evidence handoff shape)

## Mode picker

| Situation | Mode |
|-----------|------|
| Solo, small change, clean tree | Shared-checkout OK |
| Parallel implementation | **Branch / worktree** (default) |
| Teamwork scripts present + rapid prototype | Shared-checkout + locks |
| Merge history must stay linear/reviewable | **Branch / worktree** |

## Setup (branch / worktree mode)

```bash
git status --short --branch
git worktree add .worktrees/<task-id> -b ag/<task-id> <base-ref>
cd .worktrees/<task-id>
```

- Protocol branch prefix: `ag/<task-id>`
- Teamwork interop: `agent/<task-id>` accepted; do not mix prefixes for one task
- Fallback: separate clone if worktrees unavailable
- Ensure `.worktrees/` is gitignored at repo root
- Confirm path, branch, baseline commit before any edit

## Dirty-tree rules

```text
- [ ] Baseline dirty paths recorded in handoff
- [ ] No reset --hard / clean / stash-clobber of pre-existing work
- [ ] No git add . ; stage only in-scope paths
- [ ] Generated artifacts unstaged unless explicitly in scope
- [ ] Commit/push only if user or orchestrator authorized
```

Pulse dead-end recovery (`reset --hard`) applies only to **this agent’s** failed branch/worktree, never to wipe sibling or human dirty state on the primary checkout.

## Context pack (delegator must provide)

```markdown
## Context pack — <task-id>
- repo: <absolute>
- worktree: <absolute or “create per ADR-0002”>
- base_ref: <sha or branch>
- goal: <one paragraph>
- depends_on: <ids or none>
- owned_files: <list>
- out_of_scope: <list>
- verify_commands: <exact>
- constraints: no push | no drive-by refactor | ...
```

## Evidence-bearing handoff (Worker must return)

```markdown
## Handoff — <task-id>
- status: done | blocked | in_progress
- worktree: <absolute>
- branch: ag/<task-id> | agent/<task-id>
- baseline: <sha>
- changed_paths:
  - path/...
- commands_and_results:
  - `cmd` → exit <n> ; summary <pass/fail>
- known_failures_or_skips: <list or none>
- commit: <sha | none>
- push: yes | no
- verification_layers: unit | integration | e2e | live (as run)
```

**Forbidden:** “Tests passed” without commands/results; calling focused checks full acceptance.

## Parent / Owner after handoff

1. Open the **actual** worktree (not only the narrative).
2. Run applicable Verification Ladder stages (ADR-0001).
3. Only then merge/rebase to integration branch; prefer linear history.
4. Remove worktree when fully merged: `git worktree remove ...` (after cleanup policy).

## Optional teamwork scripts

If present:

```bash
python3 scripts/tasks.py claim <task-id>
python3 scripts/lock.py <files...> "<reason>"
# ... work ...
python3 scripts/tasks.py verify-complete <task-id>   # filesystem only — still run real tests
python3 scripts/unlock.py <files...>
```

`verify-complete` ≠ Verification Ladder.

## Anti-patterns

- Two agents editing primary checkout without locks
- Worker marks task board done without handoff fields
- Parent accepts on exit code of one focused test
- Mixing `ag/` and `agent/` branches for the same task id
- Committing another agent’s dirty files from a shared tree
