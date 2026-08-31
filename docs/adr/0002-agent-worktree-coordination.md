# ADR-0002: Branch/worktree coordination for feature development

## Status

Accepted

## Context

MRPG Realms is being built from the HappyMonkeyAI Agents Protocol and will need several dependency-closed feature slices across the Three.js client, authoritative server, and shared protocol. The parent checkout also contains an intentionally dirty scaffold and local research-derived work. Concurrent agents editing that checkout would make ownership and acceptance ambiguous.

The updated `HappyMonkeyAI/ai-agent-teamwork-prompt` repository provides a branch/worktree model and evidence-bearing handoffs that fit this project better than a shared-checkout swarm as the default.

## Decision

Use branch/worktree mode for implementation:

- the parent integration branch is the only integration surface;
- each implementation task uses `.worktrees/<task-id>` and an `agent/<task-id>` branch;
- `.agent-tasks.json` records the task-specific `baseRef`, owned paths, protected paths, dependencies, and verification commands;
- scope review unions `baseRef..HEAD`, modified files, and untracked files;
- one path has one writer at a time;
- worker completion is an evidence-bearing handoff, not acceptance;
- the parent independently runs the complete project and browser gates before accepting work.

Keep manifest-mode coordination available as a later opt-in for rapid prototypes, but do not make it the default. Keep ephemeral coordination files and worktrees out of Git; keep the task ledger and durable decisions reviewable.

## Consequences

- Feature work has isolated ownership and reviewable branch history.
- Existing dirty changes are protected from worker edits.
- Worktree creation and reconciliation add small setup overhead.
- The project needs explicit task scoping before implementation can begin.
- A worker can report focused success without falsely implying integrated acceptance.

## References

- `AGENTS.md`
- `CONTEXT.md`
- `HERMES.md`
- `.agent-tasks.json`
- `scripts/check_changed.py`
- `https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt`
- `https://github.com/HappyMonkeyAI/AgentsProtocol`
