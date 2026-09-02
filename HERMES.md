# HERMES.md — MRPG Realms

## Before coding

1. Read `CONTEXT.md`, `AGENTS.md`, active plan under `docs/plans/`.
2. Prefer surgical edits; keep shared protocol types in `shared/`.
- Ports 9401/9402 are reserved for this project on .215.
- Use `./start.sh` and `./stop.sh` for the managed local dev stack; they keep runtime state under ignored `.tmp/`.

## Verify after changes

```bash
npm run typecheck
npm test
curl -sS http://127.0.0.1:9402/health
# with dev running: open http://127.0.0.1:9401
```

## Git safety

- No autonomous commit/push/reset unless Stephen asks.
- Do not commit `.env`.

## Agent execution

- Read `.agent-tasks.json` before delegating or starting a feature slice.
- Prefer `.worktrees/<task-id>` plus `agent/<task-id>` for every implementation writer.
- Do not delegate against this dirty parent checkout without explicitly protecting existing paths.
- Require exact changed paths and real verification output in worker handoffs; independently verify before acceptance.
- Run `python3 scripts/check_changed.py --base <baseRef>` from the worker worktree when the task declares validation lanes.

## Useful local references (read-only)

- `.215:~/Documents/www/Realms` — GatherRealms Phaser source + sprites
- `.215:~/Documents/www/MRPG` — MRPG classes/combat
- `.215:~/projects/xeno-gate-ggez/threejs/` — procedural terrain / game skills clones
- Web host GatherRealms live stack if needed for behavior parity
