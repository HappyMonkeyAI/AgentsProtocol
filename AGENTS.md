# AGENTS.md — MRPG Realms

## Project

Hybrid MRPG + GatherRealms multiplayer Three.js realm.

## HappyMonkeyAI Agents Protocol

Follow https://github.com/HappyMonkeyAI/AgentsProtocol — Echo / Ripple / Pulse / Sanity lenses.

### LTM

- Canonical: `.agent/memories/`
- Insights: `.agent/memories/codebase_insights/`
- Decisions: `.agent/memories/architectural_decisions/`
- Patterns: `.agent/memories/patterns_and_lessons.md`

### Host overrides (Stephen)

- **No** autonomous `git commit` or `git reset --hard` unless explicitly requested.
- Named coding CLIs (codex/agy/gemini/opencode) when directed.
- Do not expose secrets from `.env`.

### Branch/worktree coordination

- Use branch mode for implementation work: one integration feature branch plus one isolated worktree per task under `.worktrees/<task-id>` on `agent/<task-id>`.
- Before editing, confirm the worktree, branch, `baseRef`, owned paths, protected paths, and verification commands in `.agent-tasks.json`.
- One path has one writer. Do not edit another worker's owned paths or run broad acceptance checks against a moving worktree.
- Preserve this repository's pre-existing dirty and untracked files; never reset, clean, stash, or overwrite them implicitly.
- Worker completion is a handoff, not acceptance. The parent independently reviews the complete diff and runs the final project gates.
- Handoffs must include the absolute worktree, branch, exact changed paths, real command results, known failures/skips, and commit/push status.
- `scripts/check_changed.py` is a changed-path validation helper; its result selects checks but does not replace the final full gate.

## Stack pins

- Client ports: **9401** (Vite), server **9402** (Socket.IO)
- Three.js via npm `three` (keep versions in package.json)
- Shared protocol in `shared/protocol.ts` — change server+client together

## Sanity checklist

Before proposing large changes, read:

1. `README.md`
2. `CONTEXT.md`
3. `docs/plans/2026-08-29-mrpg-realms.md`
4. Relevant `.agent/memories/*`

After a substantial slice ships, append a factual entry to `PROGRESS.md` and update `docs/TESTING.md` when the primary browser interaction changes. Keep code/tests authoritative over progress prose.

## Verification

```bash
npm run typecheck && npm test
curl -sS http://127.0.0.1:9402/health
```

## Voice log (optional)

Significant completions may write TTS summaries per VOICE_LOG_PROTOCOL if that host path exists.
