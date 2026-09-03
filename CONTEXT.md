# CONTEXT.md — Agents Protocol

## Stack / nature

Protocol repository: agent behavior rules, system prompts, curated skills, LTM layout, and stress tests. Not an application runtime.

## Architecture decisions

| ADR | Summary |
|-----|---------|
| [ADR-0001](docs/adr/0001-verification-ladder-and-owner-adversary.md) | Verification Ladder V0–V4 + Owner-as-Adversary before Done/Ratchet. Worker self-report ≠ proof. Trident ≠ feature acceptance. |
| [ADR-0002](docs/adr/0002-isolated-worktrees-and-evidence-handoffs.md) | Branch/worktree mode for parallel work; context packs; evidence handoffs. Upstream: ai-agent-teamwork-prompt ADR-003. |

## Rules (high signal)

- Documentation spine: README, CONTEXT, AGENTS, `docs/adr/`, `research/`.
- Trinity: Echo / Ripple / Pulse (+ Sanity grounding).
- uSwarm: Architect → Manager → Worker → **Owner (adversary verify & merge)**.
- Parallel Workers default to isolated `.worktrees/<task-id>` + `ag/<task-id>` (ADR-0002).
- Ratchet only after applicable Verification Ladder stages (or recorded human waiver).
- Prefer small vertical slices over giant features + heavy QA.

## What not to do

- Mark feature Done on Worker unit tests or narrative alone.
- Treat Trident logic/security audit as a substitute for Owner V2/V3.
- Mandate commercial AI QA SaaS as protocol default.
- Unbounded exploratory browser crawls (use SPEC checklist + time/step budget).
- Skip V0 for code changes.
- Parallel agents on one dirty shared checkout without locks or worktrees.
- Reset/clean pre-existing dirty paths to convenience an agent.
- Accept task-board complete without evidence-bearing handoff + Owner review.

## Research

- `research/2026-09-03-agentic-feature-brute-verification.md` — external brute-verification patterns; cherry-pick/avoid.
- `research/2026-09-03-isolated-worktrees-teamwork.md` — teamwork worktree/branch cherry-pick.

## Skills (verification / orchestration)

- `skills/tdd-orchestrator` — Worker TDD (supports V0).
- `skills/owner-adversary-verification` — Owner ladder checklist + evidence artifact.
- `skills/isolated-worktree-handoff` — worktree setup, context pack, evidence handoff.
