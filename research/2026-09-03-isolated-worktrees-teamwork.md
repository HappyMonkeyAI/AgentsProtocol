# Research: Isolated worktrees and multi-agent git hygiene

**Date:** 2026-09-03  
**Source:** [HappyMonkeyAI/ai-agent-teamwork-prompt](https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt) (v0.1.0-beta; upstream ADR-003)  
**Decision:** Adopted into Agents Protocol as ADR-0002.

## Upstream capabilities cherry-picked

| Upstream | Protocol mapping |
|----------|------------------|
| Branch mode: `.worktrees/<task-id>` + `agent/<task-id>` | ADR-0002; prefix `ag/<task-id>` preferred, `agent/` interop |
| Evidence-bearing handoff | Required Worker → parent fields; feeds Owner ADR-0001 |
| Context pack on delegate | Required for parallel Workers |
| Preserve dirty trees | No reset/clean to convenience the agent |
| Parent owns acceptance | Aligns Owner-as-Adversary |
| File locks + tasks.py | Optional when scripts present (shared-checkout mode) |
| Changed-aware `check_changed.py` | Optional product tooling; not protocol-required |

## Avoid copying wholesale

- Mandating full teamwork bootstrap on every Agents Protocol repo
- Treating task-board `verify-complete` (file existence) as test proof
- Shared `AGENT_ID` across agents
- Unbounded force-unlock of fresh locks

## Fit with ADR-0001

Worktrees isolate writers; Verification Ladder proves behavior. Neither replaces the other.

## Revisit when

- Native agent runtimes provide stronger workspace isolation than git worktrees
- Monorepo tooling needs registered worktree hooks (install, env) documented per project
