# CONTEXT.md — Agents Protocol

## Stack / nature

Protocol repository: agent behavior rules, system prompts, curated skills, LTM layout, MCP intent map, and stress tests. Not an application runtime.

## Architecture decisions

| ADR | Summary |
|-----|---------|
| [ADR-0001](docs/adr/0001-verification-ladder-and-owner-adversary.md) | Verification Ladder V0–V4 + Owner-as-Adversary before Done/Ratchet. Worker self-report ≠ proof. Trident ≠ feature acceptance. |
| [ADR-0002](docs/adr/0002-isolated-worktrees-and-evidence-handoffs.md) | Branch/worktree mode for parallel work; context packs; evidence handoffs. Upstream: ai-agent-teamwork-prompt ADR-003. |
| [ADR-0003](docs/adr/0003-mcp-intent-map-and-bootstrap-discovery.md) | `MCP.md` intent routing + bootstrap discovery → `MCP.local.md`. Listed ≠ mounted; live proxy wins availability. |

## Rules (high signal)

- Documentation spine: README, CONTEXT, AGENTS, **MCP.md**, `docs/adr/`, `research/`.
- Trinity: Echo / Ripple / Pulse (+ Sanity grounding including MCP.md).
- uSwarm: Architect → Manager → Worker → **Owner (adversary verify & merge)**.
- Parallel Workers default to isolated `.worktrees/<task-id>` + `ag/<task-id>` (ADR-0002).
- Ratchet only after applicable Verification Ladder stages (or recorded human waiver).
- Prefer small vertical slices over giant features + heavy QA.
- MCP: route by intent; dynamic_proxy activate when missing; no secrets in git.

## What not to do

- Mark feature Done on Worker unit tests or narrative alone.
- Treat Trident logic/security audit as a substitute for Owner V2/V3.
- Mandate commercial AI QA SaaS as protocol default.
- Unbounded exploratory browser crawls (use SPEC checklist + time/step budget).
- Skip V0 for code changes.
- Parallel agents on one dirty shared checkout without locks or worktrees.
- Reset/clean pre-existing dirty paths to convenience an agent.
- Accept task-board complete without evidence-bearing handoff + Owner review.
- Assume empty session MCP list means AuditScan/sentinel/research do not exist.
- Treat 192.168.5.215 alone as the MCP catalogue (local Hermes/MonkeySwarm is the plane).

## Research

- `research/2026-09-03-agentic-feature-brute-verification.md`
- `research/2026-09-03-isolated-worktrees-teamwork.md`
- `research/2026-09-03-mcp-intent-map-and-lan-scan.md`

## Skills

- `skills/tdd-orchestrator` — Worker TDD (supports V0).
- `skills/owner-adversary-verification` — Owner ladder checklist + evidence artifact.
- `skills/isolated-worktree-handoff` — worktree setup, context pack, evidence handoff.
- `skills/mcp-intent-routing` — MCP.md routing + bootstrap discovery checklist.
