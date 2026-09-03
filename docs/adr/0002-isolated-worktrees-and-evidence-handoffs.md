# ADR-0002: Isolated worktrees, branch mode, and evidence-bearing handoffs

## Status

Accepted

## Context

Agents Protocol already has uSwarm (Architect → Manager → Worker → Owner), feature branches (`ag/...`), and ADR-0001 (Verification Ladder; Worker self-report ≠ Done). Parallel agents still collide when they share one dirty checkout: silent overwrites, wrong branch, `git add .` sweeping unrelated dirt, and “focused test green” reported as full acceptance.

[ai-agent-teamwork-prompt](https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt) (ADR-003 there) solved this with:

- **Branch mode:** one Git worktree per task under `.worktrees/<task-id>`, branch `agent/<task-id>` (or protocol alias `ag/<task-id>`)
- **Self-contained context packs** for delegates
- **Evidence-bearing handoffs** (paths, commands, real results, commit/push status)
- Parent/orchestrator owns final acceptance; preserve pre-existing dirty state

That stack is complementary to ADR-0001 and should be protocol law for multi-agent / parallel implementation—not only when the full teamwork scripts are installed.

## Decision Drivers

* Safe parallel implementation without clobbering sibling agents or human dirty work
* Reviewable history when merge quality matters
* Handoffs that Owner can independently verify (feeds ADR-0001)
* Stay portable: plain git worktrees; teamwork scripts optional
* Low ceremony for solo Quick Mode on a clean tree

## Considered Options

### Option 1: Shared checkout only + hope locks suffice
- **Pros**: Zero worktree overhead
- **Cons**: Collisions, dirty-tree risk, weak history when multiple agents commit

### Option 2: Require full ai-agent-teamwork-prompt always
- **Pros**: Locks + task board + worktrees
- **Cons**: Heavy dependency for every Agents Protocol repo; not always present

### Option 3: Protocol modes + worktree law when parallel/clean-history (chosen)
- **Pros**: Portable git primitives; optional teamwork scripts; aligns Owner evidence
- **Cons**: Agents must choose mode explicitly

## Decision

### Two implementation modes

| Mode | When | Isolation |
|------|------|-----------|
| **Shared-checkout** | Solo agent, Quick Mode, or rapid swarm with file locks (teamwork `lock.py` / manifest) | Same tree; lock or non-overlapping file claims |
| **Branch / worktree** | Parallel Workers, clean merge history required, or user/orchestrator selects branch mode | One worktree + one branch per task |

Default for **parallel delegated implementation**: **branch / worktree mode**.

### Worktree and branch convention

```bash
git status --short --branch
git worktree add .worktrees/<task-id> -b ag/<task-id> <base-ref>
cd .worktrees/<task-id>
```

- Preferred branch prefix in Agents Protocol: `ag/<task-id>` (existing convention).
- Interop with teamwork templates: `agent/<task-id>` is accepted as equivalent; do not mix both for the same task id.
- Separate clone is acceptable when `git worktree` is unavailable.
- Add `.worktrees/` to project `.gitignore` when adopting branch mode.
- Confirm worktree path, branch, and baseline commit **before** editing.

### Dirty-tree hygiene

- Record baseline dirty paths in the handoff.
- **Never** `reset --hard`, clean, stash-pop-over, or overwrite pre-existing changes to “make the tree convenient” unless the user explicitly orders recovery (Pulse dead-end on **this agent’s** branch only).
- Do not `git add .` / stage generated artifacts or unrelated dirty files.
- Commit/push only when user or orchestrator authorizes (protocol Ratchet still applies on the agent’s branch after Verification Ladder).

### Context pack (delegator → Worker)

Every delegated implementation task includes at least:

- Absolute repo and worktree path
- Task goal and `depends_on`
- Owned files / out-of-scope paths
- Baseline ref/commit and verification commands expected
- Constraints (no push, no drive-by refactors, etc.)

### Evidence-bearing handoff (Worker → parent/Owner)

Required fields:

- Task id and status
- Absolute worktree path and branch
- Exact changed paths (including untracked in scope)
- Commands run and **real** results (test/build/typecheck/lint/runtime)
- Known failures, skipped checks, environmental limits
- Commit hash if committed; explicit “no commit” / “no push” otherwise

Focused or partial checks must be labeled as such. They are not full acceptance.

### Acceptance ownership

- Parent/orchestrator (Owner path) independently reviews the **actual** worktree and runs applicable ADR-0001 stages.
- Task-board `done` or Worker success narrative is not acceptance.
- Merge/rebase onto main only after Owner acceptance; prefer linear history (rebase then merge/ff) when project policy allows.

### Optional teamwork tooling

When `scripts/tasks.py` / locks exist, use them for claim/lock/heartbeat. Protocol does **not** require those scripts for branch mode—git worktree + handoff + Owner ladder are sufficient.

## Consequences

### Positive

* Parallel Workers stop stepping on each other
* Handoffs become machine-checkable inputs to Owner V0–V4
* Aligns Agents Protocol with HappyMonkeyAI teamwork ADR-003 without forking two doctrines

### Costs

* Worktree setup overhead on multi-agent slices
* Disk use under `.worktrees/`
* Agents must not treat shared-checkout as default under parallel load

### Follow-ups

* AGENTS.md + system prompts cite this ADR
* Skill `isolated-worktree-handoff` operationalizes checklist
* Research note links upstream teamwork repo
* Keep branch prefix `ag/` in protocol; document `agent/` interop

## Related

* Upstream: [HappyMonkeyAI/ai-agent-teamwork-prompt](https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt) ADR-003
* ADR-0001 Verification Ladder and Owner-as-Adversary
* skills/isolated-worktree-handoff
* skills/owner-adversary-verification
