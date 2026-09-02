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
- Voice: bounded push-to-talk, browser recognition fallback, automatic room-chat sending, and optional recipient browser TTS; Google Cloud Speech-to-Text v2 remains optional
- World: simplex-noise heightfield chunks, streamed around the player
- Shared: role stats + protocol types in `shared/`

## Quick start

```bash
cd ~/projects/MRPGRealms
cp -n .env.example .env
npm install
npm run dev
```

For a background local stack with a PID file and health-checked startup:

```bash
./start.sh
./stop.sh
```

Runtime output is written to `.tmp/mrpg-realms-dev.log` (ignored by Git).

- Client: http://127.0.0.1:9401
- Server health: http://127.0.0.1:9402/health

## Production deployment

The deployment host is `192.168.5.80` and the production hostname is `https://realms.happymonkey.ai`.
After syncing this repository to `/home/stephen/projects/MRPGRealms`, run the deployment script interactively on that host:

```bash
cd ~/projects/MRPGRealms
./deploy.sh
```

The script builds and verifies the app, starts the user-level `mrpg-realms.service` on internal port `9412`, obtains the Let’s Encrypt certificate when needed, installs the nginx vhost, validates nginx before reload, and checks the public HTTPS health endpoint. It preserves the previous nested checkout and does not print `.env` contents.

Voice transcription is disabled by default. To enable it, configure `VOICE_PROVIDER=google`, `GOOGLE_APPLICATION_CREDENTIALS` to a server-only service-account JSON file, and optionally `GOOGLE_CLOUD_PROJECT`, `GOOGLE_SPEECH_LOCATION`, and `GOOGLE_SPEECH_LANGUAGE` in the server `.env`. Never expose those credentials to the client or commit them.

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
- `PROGRESS.md` — newest-first implementation slice journal
- `docs/TESTING.md` — browser and automated acceptance checklist
- `docs/research/reference-scan.md` — local + GitHub evidence
- `docs/research/LINKS.md` — curated Three.js/WebGL references and Realms dispositions
- `docs/research/bedrock-world-save-inspection.md` — uploaded Bedrock save findings and persistence boundary
- `docs/plans/2026-08-29-mrpg-realms.md` — phased implementation plan
- `docs/adr/0001-hybrid-threejs-realm.md` — architecture decision
- `docs/adr/0007-voice-chat-boundaries.md` — voice transcript, playback, and command safety boundaries
- `docs/adr/0008-voice-reliability-and-live-channel.md` — voice MVP limitations and live-channel evaluation

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
