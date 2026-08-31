# Patterns and lessons — MRPG Realms

## Success

- Reuse **seed + chunk streaming** from GatherRealms/MRPG rather than inventing a new world model.
- Keep Phaser games online; evolve in a new Three.js repo.
- Server authority for combat/build mirrors EchoesOfAion discipline.
- Heightfield MVP before voxels avoids meshing complexity.

## Failure risks (pre-mortem)

- Trying to port full Phaser scene graphs → thrash. Port systems instead.
- Absolute world coordinates without floating origin → GPU shimmer at distance.
- Syncing all players globally → bandwidth wall; need AOI early when >~20 players.
- Copying node_modules from Documents/www trees → disk waste and broken paths.
