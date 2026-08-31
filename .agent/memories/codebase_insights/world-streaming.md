# World streaming

- Client builds heightfield chunk meshes from shared seed (`shared/noiseWorld.ts`).
- `WORLD.loadRadius` controls residency; unload outside radius to bound GPU memory.
- Server does **not** send terrain meshes — only seed + structure diffs.
- GatherRealms used 8×8 tiles of 16px; Three MVP uses 16×16 tiles of size 2 world units (tunable).
