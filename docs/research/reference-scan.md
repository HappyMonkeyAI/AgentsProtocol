# Reference scan — MRPG Realms / Three.js hybrid

Date: 2026-08-29

## Product thesis

Merge MRPG class combat with GatherRealms persistent building into one multiplayer Three.js realm with a rolling procedurally generated world. Feasible if we treat the world as **chunk-streamed** (not monolithic), keep **server authority**, and escalate rendering cost carefully (heightfield → instancing → optional voxels).

## Local lineage

| Source | Location | Reuse |
|--------|----------|-------|
| GatherRealms | webhost `~/projects/home/GatherRealms/GatherRealms`; `.215:~/Documents/www/Realms` | ChunkManager, WorldGenerator seeds, buildings, Socket patterns |
| MRPG | `~/projects/home/MRPG/MRPG`; `.215:~/Documents/www/MRPG` + `mrpg` | Classes (Fighter/Ranger/Mage), combat, mobs, sprite tools |
| Live site | `https://realms.stephenphillips.co.uk` | UX baseline (Gather Realms title) |
| EchoesOfAion | `~/projects/projects/EchoesOfAion` | Three.js client patterns, server authority, Agents Protocol docs |
| xeno-gate-ggez | `.215:~/projects/xeno-gate-ggez` | Runtime packages + `threejs/` research clones |
| threejs pack | `.215:.../threejs/ProceduralTerrains`, `tiny-world-builder`, `threejs-game-skills`, `digital-world`, `fable5-world-demo` | Terrain, LOD, world builders |
| spritemaker | `.215:~/Documents/www/spritemaker` | Sprite pipeline |
| ThreeDeeCity | local threedeecity + EOA LINKS | Camera interaction paradigms |
| img2threejs | https://github.com/img2threejs/img2threejs / img2threejs.org | Image → procedural Three factory / GLB component packs for props & characters |

### Existing chunk parameters (GatherRealms)

- `TILE_SIZE: 16` px, `CHUNK_SIZE: 8` tiles, load radius 4 / unload 5
- Simplex multi-octave terrain + structure noise
- Socket.IO multiplayer with client prediction notes in README

### MRPG classes (baseline)

- Fighter 150 HP melee · Ranger 100 HP arrows · Mage 70 HP bolts
- Hybrid adds **Healer** + **Builder** as first-class roles

## External evidence (Three.js large worlds)

| Project | Why it matters |
|---------|----------------|
| [lostab/World-Simulator](https://github.com/lostab/World-Simulator) | Infinite terrain, floating origin, instanced vegetation, R3F |
| [SimonDev floating origin](https://www.youtube.com/watch?v=qYdcynW94vM) + three.js discourse | GPU float precision fails far from origin — mandatory for “big” worlds |
| [voxelize](https://github.com/iantheearl/voxelize) | Serious voxel multiplayer engine path if we go full voxel later |
| [LooperSalty/nexagen](https://github.com/LooperSalty/nexagen) | Three.js chunks + workers + multiplayer stack (ambitious reference) |
| [Raju-Adhikary/infinite-world-game_boilerplate](https://github.com/Raju-Adhikary/infinite-world-game_boilerplate) | Chunk manager + biome + Three + Rapier starter |
| [Reterics/another-try](https://github.com/Reterics/another-try) | Three.js multiplayer RPG pretensions, Socket.IO, prediction |
| [PeerPigeon/PigeonWorld](https://github.com/PeerPigeon/PigeonWorld) | Procedural Three multiplayer (P2P — different net model) |
| three.js manual [Billboards](https://threejs.org/manual/en/billboards.html) / [Game](https://threejs.org/manual/en/game.html) | Sprite facades + ECS-ish game structure |

## Feasibility: “big rolling procedural world” in Three.js?

**Yes, with constraints.**

| Approach | Pros | Cons | Fit |
|----------|------|------|-----|
| Heightfield chunks (chosen MVP) | Cheap, matches 2D tile mental model, easy class/build overlay | Less “Minecraft dig” | **Best hybrid start** |
| Instanced props + billboards | Reuses sprite packs fast | Flat characters at angle | Phase 1–2 |
| Full voxels + greedy mesh | Editable terrain | CPU/meshing cost, harder combat feel port | Optional later |
| Planet-scale continuous mesh | Impressive | Needs floating origin, LOD, workers immediately | Overkill |

### Hard requirements for scale

1. **Chunk stream/unload** (already in Phaser games; port the idea)
2. **Floating origin** once |player| ≫ ~1e4 units (or earlier if jitter)
3. **Instancing** for trees/rocks/grass
4. **Interest management** (only sync nearby players/structures)
5. **Workers** for meshing if voxel or dense foliage
6. **Server not generating full meshes** — seed + diffs (structures) only

### Hybrid design implication

Combat and building share **the same spatial index**. Persistence is **structure diffs + inventories**, not the whole heightfield. Class combat is entity AOI; building is sparse authoritative objects.

## img2threejs role

Use for **hero props and class silhouettes** (buildings, weapons, landmarks), not for every tile. Pipeline: sprite/concept image → factory or GLB pack → LOD → place in structure atlas. Keep terrain procedural; keep mobs billboard/rigged later.

## Risks

- Scope explosion (two full games + 3D rewrite)
- Netcode: Phaser prediction assumptions differ in 3D physics
- Art direction mismatch between pixel sprites and PBR three scenes
- Host resource: `.215` has large Phaser trees already — don't duplicate node_modules

## Decision for MVP

Ship a **playable thin slice** on .215: join as class or builder, walk a seeded Three world, place a hut, basic hit/heal. Expand along the plan phases.
