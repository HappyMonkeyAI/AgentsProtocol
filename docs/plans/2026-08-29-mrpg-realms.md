# MRPG Realms Implementation Plan

> **For Hermes:** Use subagent-driven-development or a named coding CLI to implement task-by-task after the MVP shell.

**Goal:** One multiplayer Three.js realm where players choose Warrior/Ranger/Mage/Healer (MRPG combat) or Builder (GatherRealms-style persistent bases) on a rolling procedural world.

**Architecture:** Vite Three.js client streams heightfield chunks from a shared seed; Node Socket.IO server authorizes HP and structures; roles gate combat vs build. Escalate to floating origin, instancing, persistence, and img2threejs assets in later phases.

**Tech Stack:** TypeScript, Three.js r170+, Vite 6, Express, Socket.IO, simplex-noise, alea. Optional later: better-sqlite3, Rapier, R3F (not required for MVP).

---

## Phase 0 — Bootstrap (done in scaffold)

- [x] Clone AgentsProtocol → `~/projects/MRPGRealms` on .215
- [x] CONTEXT / HERMES / MANIFEST / ADR / research
- [x] Client + server + shared protocol MVP

### Verify

```bash
cd ~/projects/MRPGRealms && npm install && npm test && npm run typecheck
npm run dev
curl -sS http://127.0.0.1:9402/health
```

---

## Phase 0.5 — Seed invites / multiplayer rooms (done)

**Objective:** MRPG-style multiplayer where a **shared world seed** is the invite.

- [x] `normalizeWorldSeed` + `randomWorldSeed` in `shared/protocol.ts`
- [x] Server `RoomRegistry` — one Socket.IO room per seed (`world:<seed>`)
- [x] Join carries `worldSeed`; response returns `inviteCode` + `playerCount`
- [x] Events (move/build/combat) scoped to seed room only
- [x] Menu: seed field, Random, `?seed=` deep link, copy invite URL HUD
- [x] `GET /api/worlds`, `GET /api/invite/:code`, health lists active worlds
- [x] Cap `WORLD.maxPlayersPerWorld` (32)

**How friends join**

1. Host opens client → Random (or types a memorable seed) → Enter Realm  
2. Copy invite link from top-right (`?seed=realm-xxxxxxxx`)  
3. Friend opens same link (or pastes the seed) → same terrain + same multiplayer room  

```bash
curl -sS http://127.0.0.1:9402/api/worlds
curl -sS http://127.0.0.1:9402/api/invite/forest-01
```

---

## Phase 1 — World parity with GatherRealms noise

**Objective:** Closer biome distribution and spawn rules to GatherRealms `WorldGenerator`.

**Files:**
- Modify: `shared/noiseWorld.ts`
- Create: `shared/biomes.ts`
- Test: `server/src/world/noise.test.ts`

**Steps:**
1. Port multi-octave scales from GatherRealms server `WorldGenerator.ts`.
2. Add beach-biased spawn search (MRPG SpawnManager idea).
3. Color/texture atlas stub for terrain (canvas or tileset sample from Realms `public/assets/terrain_tileset.png` — copy **asset only**, not node_modules).
4. Verify: walk from origin, water rings look natural; `npm test`.

---

## Phase 2 — Roles & combat feel

**Objective:** Distinct range/damage/heal and simple VFX per class.

**Files:**
- `shared/protocol.ts` ROLE_STATS
- `server/src/index.ts` combat handlers
- `client/src/combat.ts` (new) projectiles as sprites/lines

**Acceptance:**
- Warrior short range higher dmg
- Ranger/Mage longer range
- Healer restores HP on ally
- Builder cannot deal damage

---

## Phase 3 — Builder persistence

**Objective:** Structures survive restart.

**Files:**
- `server/src/db.ts` better-sqlite3 or JSON file store under `data/structures.json`
- Load on boot; save on place/destroy

**Acceptance:** place hut → restart server → hut remains; owner id preserved or transferred policy documented in ADR 0002.

---

## Phase 4 — Assets pipeline

**Objective:** Wire sprite packs + img2threejs path.

**Steps:**
1. Document inventory of `.215:~/Documents/www/Realms/public/assets` and MRPG class sprites.
2. Billboard characters (three.js Sprite) using cleaned sprites from `tools/sprites`.
3. Pick 3 landmark props for img2threejs (campfire, wooden wall, watchtower).
4. Store factories under `client/src/assets/factories/`.

**References:** three.js billboards manual; img2threejs skill; spritemaker on .215.

---

## Phase 5 — Scale systems

**Objective:** Survive larger travel and player counts.

1. Floating origin group when player leaves ±4096 unit box (SimonDev pattern).
2. Interest management: only emit `player:update` to sockets within N chunks.
3. InstancedMesh forest decoration.
4. Optional worker meshing if switching toward voxels.

**References:** World-Simulator floating origin; voxelize if voxel path chosen (ADR required).

---

## Phase 6 — Game systems port (selective)

Port **rules**, not Phaser code:

- GatherRealms building costs / unlock tree (subset)
- MRPG mob tiers by distance from origin
- Day/night optional

Each subsystem gets its own mini-plan before coding.

---

## Phase 7 — Deploy

- nginx vhost on chosen host
- PM2 or systemd for server
- TLS hostname decision (new subdomain vs path under realms)

Do not cut over `realms.stephenphillips.co.uk` without explicit go.

---

## Task granularity example (Phase 1 Task A)

### Task: Extract GatherRealms noise constants

**Files:** Read `.../GatherRealms/server/world/WorldGenerator.ts`; modify `shared/noiseWorld.ts`

**Step 1:** Note octave scales and thresholds in a comment block in `noiseWorld.ts`.

**Step 2:** Implement matching thresholds; unit test fixed samples.

**Step 3:** `npm test` expected PASS.

**Step 4:** Commit only if user requests.
