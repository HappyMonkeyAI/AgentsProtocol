# ADR 0001 — Hybrid Three.js realm (MRPG + GatherRealms)

## Status

Accepted — 2026-08-29

## Context

Two mature Phaser 2D multiplayer games exist:

- **MRPG**: Fighter/Ranger/Mage classes, PvP, mobs, chunk world
- **GatherRealms**: building, resources, structures, same chunk lineage

Stephen wants a Three.js evolution where players pick combat classes **or** builder mode in one shared procedural realm, reusing local sprite/three research (xeno-gate-ggez threejs pack, EchoesOfAion, img2threejs).

## Decision

1. **New product repo** `MRPGRealms` (not a live cutover of realms.stephenphillips.co.uk).
2. **Three.js client** with heightfield chunk streaming (not full voxel Minecraft unless later justified).
3. **Socket.IO authority** for HP and structures (same family as existing games).
4. **Role is a mode gate**: combat roles fight; builder places; shared spatial world.
5. **Asset path**: keep 2D sprites as billboards/impostors first; graduate key props via img2threejs factories.
6. **Large-world readiness**: design for floating origin + chunk unload from day one; implement floating origin when coords demand it.

## Consequences

- Faster visual upgrade path than rewriting Phaser.
- Must reimplement input/camera/combat feel in 3D.
- Persistence and balance are product work, not automatic with the renderer swap.
- Legacy Phaser sites stay online until an explicit migration.
