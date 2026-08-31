# ADR-0003: Palette-stepped toon materials for the first visual pass

## Status

Accepted

## Context

The initial client used continuous `MeshStandardMaterial` lighting for terrain, players, and structures. The `craftzdog/ghibli-style-shader` example demonstrates a useful visual idea—discrete light-value bands—but its custom shader is a tutorial-specific foliage implementation that bypasses parts of Three.js's normal material pipeline.

## Decision

Use a shared four-band `THREE.MeshToonMaterial` helper with a nearest-filtered `DataTexture` gradient map for the first stylized visual pass. Apply it to terrain, players, and placeholder structures while preserving the existing hemisphere light, directional-light shadows, terrain vertex colors, and fog.

Keep richer PBR materials available for reviewed props such as the img2threejs crate. Do not make the upstream shader a runtime dependency and do not replace the scene with a global custom `ShaderMaterial` until a later measured need justifies it.

## Consequences

- Terrain and simple gameplay objects gain deterministic stepped lighting without new dependencies.
- Existing shadow-casting/receiving flags remain usable through the standard Three.js material path.
- The current pass is palette/value stylization, not a complete Ghibli-style art direction or outline system.
- Material palette tuning and prop-specific PBR treatment remain follow-up work.
