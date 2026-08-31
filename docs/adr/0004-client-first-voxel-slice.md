# ADR-0004: Client-first voxel interaction slice

## Status

Accepted for prototype validation

## Context

The current realm has deterministic seeded terrain and multiplayer movement, but its continuous heightfield does not yet support the Minecraft-like gather/build loop. A full server-authoritative block world would require shared block contracts, edit validation, chunk persistence, and multiplayer replication.

## Decision

Validate the interaction loop first in the client: render deterministic terrain as chunked instanced cubes, use a first-person pointer-lock camera, raycast the center crosshair, mine with left click, place with right click, and select grass/dirt/stone with number keys.

Block edits are local to the browser and intentionally do not claim multiplayer authority or persistence. Existing player movement, combat, structures, seed invites, and server contracts remain intact. The next production slice is a server-authoritative block-edit contract and persistence boundary, not more client-only state.

## Consequences

- The game now has a concrete voxel interaction target for playtesting.
- Instanced chunk meshes keep the first prototype bounded and allow affected chunks to rebuild after edits.
- Two players do not yet see each other's block edits; this is an explicit limitation.
- The existing continuous height function remains the deterministic generation source until a shared voxel/chunk contract is introduced.
