# CONTEXT.md — MRPG Realms

## Purpose

Browser multiplayer hybrid of MRPG (class combat) and GatherRealms (persistent building) on a Three.js rolling procedural world.

## Source of truth

1. Executable behavior: `client/src/`, `server/src/`, `shared/`
2. Tests: `npm test`, `npm run typecheck`
3. Product plan: `docs/plans/2026-08-29-mrpg-realms.md`
4. Research (reference only): `docs/research/`
5. Agent protocol: `AGENTS.md`, `.agent/memories/`

When docs conflict with code/tests, code wins; update docs in the same change.

## Runtime

- Node 22+, npm
- `npm run dev` → client `:9401`, server `:9402`
- Health: `GET /health` (lists active seed-worlds)
- Invites: shared **world seed** = same terrain + Socket.IO room; URL `?seed=code`
- Env: `.env` from `.env.example` — set `VITE_SOCKET_URL` to a host friends can reach

## Non-negotiables

- Server is authoritative for HP, death/respawn, structure placement eligibility.
- Deterministic world seed shared by client and server height functions.
- Multiplayer isolation by seed room (`world:<seed>`); no cross-world bleed.
- Chunk stream + unload; never keep unbounded terrain meshes.
- Builder-only placement; combat roles cannot place structures (MVP).
- No secrets in repo; no autonomous hard resets.
- Prefer reusing GatherRealms/MRPG **game rules and assets**, not Phaser rendering.

## Architecture (MVP)

```
Browser (Three.js)  --socket.io-->  Node server (RoomRegistry)
   | chunk mesh gen (join seed)        | Map<seed, WorldRoom>
   | ?seed= invite deep link           | players + structures per room
   | copy invite URL                   | combat/build scoped to room
```

Later: persistent structure store (SQLite/Postgres), AOI interest management, floating origin, instanced foliage, img2threejs props.

## What not to do

- Do not port full Phaser scenes into Three.js 1:1.
- Do not load the entire infinite world.
- Do not make the client authoritative for combat outcomes.
- Do not copy `node_modules` from legacy trees.

## Agent development infrastructure

This repository combines the HappyMonkeyAI Agents Protocol with the branch/worktree coordination pattern from `HappyMonkeyAI/ai-agent-teamwork-prompt`.

### Source of truth

- Product/runtime behavior: `client/src/`, `server/src/`, `shared/`
- Project operating rules: `AGENTS.md`, `HERMES.md`, this file
- Active task ledger: `.agent-tasks.json`
- Durable coordination decision: `docs/adr/0002-agent-worktree-coordination.md`
- Validation lane configuration: `scripts/checks.json`

### Branch mode

- The integration branch is the only parent integration surface.
- Each implementation task gets an isolated `.worktrees/<task-id>` worktree and `agent/<task-id>` branch.
- The task's `baseRef` is the exact revision used both to create and review its worktree; a global baseline is insufficient after the parent advances.
- Workers own only the paths declared in `.agent-tasks.json`; `client/`, `server/`, `shared/`, `.env`, and `.agent/memories/` are protected for the current foundations slice.
- A parent review must union committed branch changes, modified files, and untracked files before accepting scope.
- Run `python3 scripts/check_changed.py --base <baseRef> --owned <glob>...` from a task worktree; exit 3 is a hard scope failure.
- Worker reports and focused checks are evidence for review, never final acceptance. The parent runs `npm run typecheck`, `npm test`, `npm run build`, and the relevant browser/runtime checks from a stable tree.

### Coordination metadata

- `.agent-tasks.json` is the tracked, reviewable task ledger.
- `.agent-manifest.json`, `.agent-status.md`, `.agent-session.json`, `.worktrees/`, and `.tmp/` are local coordination/runtime metadata and are ignored.
- Manifest-mode locking is intentionally deferred; branch/worktree isolation is the default for feature implementation.
- The current integration branch contains a pre-existing dirty scaffold. Until that work is checkpointed or explicitly classified, child worktrees must not be created from it; this is a deliberate safety gate, not a missing setup step.
