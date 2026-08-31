# MRPG Realms

Hybrid multiplayer realm combining **MRPG** combat classes with **GatherRealms** builder persistence, re-rendered in **Three.js** with a rolling procedural world.

Live legacy 2D Phaser titles remain separate:
- GatherRealms → `https://realms.stephenphillips.co.uk`
- MRPG → `mrpg.stephenphillips.co.uk`

This repo is the **Three.js evolution**, bootstrapped with [HappyMonkeyAI AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol).

## Concept

| Mode | Roles | Loop |
|------|-------|------|
| Combat (MRPG-style) | Warrior, Ranger, Mage, Healer | Explore, fight peers/mobs, class abilities |
| Builder (GatherRealms-style) | Builder | Gather/place persistent structures (towns/bases) |

Shared world: same seed, same chunks, both modes coexist.

## Stack (MVP)

- Client: Vite + TypeScript + Three.js
- Server: Node + Express + Socket.IO (authoritative HP / structures)
- World: simplex-noise heightfield chunks, streamed around the player
- Shared: role stats + protocol types in `shared/`

## Quick start

```bash
cd ~/projects/MRPGRealms
cp -n .env.example .env
npm install
npm run dev
```

- Client: http://127.0.0.1:9401
- Server health: http://127.0.0.1:9402/health

```bash
npm run typecheck
npm test
```

## Ports

| Service | Port |
|---------|------|
| Vite client | 9401 |
| Socket/API | 9402 |

## Docs

- `CONTEXT.md` — operating manual
- `AGENTS.md` — Agents Protocol rules + host overrides
- `HERMES.md` — Hermes verification preferences
- `docs/research/reference-scan.md` — local + GitHub evidence
- `docs/plans/2026-08-29-mrpg-realms.md` — phased implementation plan
- `docs/adr/0001-hybrid-threejs-realm.md` — architecture decision

## Source lineage (do not wholesale-copy node_modules)

| Asset | Path |
|-------|------|
| GatherRealms (live/local) | `~/projects/home/GatherRealms/GatherRealms` (this host) or `.215:~/Documents/www/Realms` |
| MRPG | `~/projects/home/MRPG/MRPG` or `.215:~/Documents/www/MRPG` |
| Three.js research pack | `.215:~/projects/xeno-gate-ggez/threejs/` |
| EchoesOfAion Three.js client | `~/projects/projects/EchoesOfAion` |
| Sprite tooling | MRPG/Realms `tools/sprites`, `.215:~/Documents/www/spritemaker` |
| img2threejs | external skill/pipeline for prop/character factories |

## Host overrides

- No autonomous `git commit` / `git reset --hard` unless the user directs it.
- Named coding CLIs stay as named when requested.
