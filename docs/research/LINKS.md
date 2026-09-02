# Three.js / WebGL research links

Curated references for MRPG Realms. These are not runtime dependencies. Each entry records the upstream repository, a pinned default-branch commit, the useful technique, a Realms disposition, and the smallest safe follow-up experiment.

Research snapshot: 2026-09-02. Repository metadata and README claims were fetched from GitHub. No repository was cloned or executed in this pass. All listed repositories reported an MIT license through the GitHub repository API, but bundled assets, linked Sketchfab models, fonts, demos, and generated output still require separate rights review before promotion.

## Recommended order for Realms

1. `LinearAbilityExtThreeJS` — spell/ability targeting and VFX language.
2. `GeometryPainterThreeJS` — surface-attached impact, molten/crystal/fissure effects.
3. `realistic-forest` — grounded foliage, wind, atmospheric presentation, without importing a large asset pack.
4. `BasicProceduralBuilding` — deterministic low-poly structure generation.
5. `RainSystemThreeJS` / `SnowSystemThreeJS` — optional weather overlays after graphics settings and performance budgets exist.
6. `WaterThreeJS` / `OceanThreejs` — later water-boundary or ocean realm work; currently too expensive for the core voxel slice.

## High-value candidates

### LinearAbilityExtThreeJS

- URL: https://github.com/achrefelouafi/LinearAbilityExtThreeJS
- Pinned ref: `main` @ `bf58757ab9b6057515470aa074cdb4026bc54ed7`
- License signal: MIT repository metadata
- README evidence: skillshot sandbox with line, far, gate, ring, and scribe casts; handwritten GLSL; targeting indicators and authored ability sequences.
- Realms disposition: **evaluate**
- Fit: Strong candidate for a first spell-casting slice: server-authoritative cast intent, client-side bounded telegraph, projectile/ground impact, and reusable slash/spell VFX.
- Smallest experiment: add one local-only `SlashArc` or `groundBurst` effect factory behind a feature boundary; validate lifetime, disposal, camera readability, and no gameplay-state ownership.
- Risks: the cinematic VFX may be much more expensive than a voxel combat effect; inspect asset provenance separately from the MIT code signal.

### GeometryPainterThreeJS

- URL: https://github.com/achrefelouafi/GeometryPainterThreeJS
- Pinned ref: `main` @ `79c7556ab8c5d7bcf92fa92d7fc8063db298b5e1`
- License signal: MIT repository metadata
- README evidence: WebGPU with WebGL fallback; extensible surface-painting modes; crystals and molten fissures that grow from strokes and animate.
- Realms disposition: **evaluate as a reference pattern**
- Fit: Useful for impact marks, burning cracks, corruption, ice growth, or sword-hit effects attached to a block/structure surface. It is not a direct combat system.
- Smallest experiment: convert one stroke result into a bounded `THREE.Group` attached to a hit face, with a 1–2 second lifetime and explicit disposal.
- Risks: WebGPU path and transmissive/material-heavy effects need a WebGL2 fallback and a strict instance/budget cap.

### realistic-forest / Sylva

- URL: https://github.com/Token-Gremlin/realistic-forest
- Pinned ref: `main` @ `4a0c7ec8c81dcc5c50dadf8ffae557b3878debb8`
- License signal: MIT repository metadata
- README evidence: procedural forest editor; trees, grass, water, sky, clouds, and weather generated from GLSL/growth rules without downloaded art; WebGL2 and Three.js.
- Realms disposition: **evaluate selectively**
- Fit: Best reference for improving the current authored landscape while preserving seeded placement: wind response, atmospheric depth, procedural silhouettes, and low-asset rendering.
- Smallest experiment: add a distance-bounded wind phase to existing grass/tree materials; keep Y placement derived from the server/client terrain height function and retain chunk disposal.
- Risks: the cinematic forest is a separate scene model; do not replace voxel terrain or copy whole-scene assumptions.

### BasicProceduralBuilding

- URL: https://github.com/achrefelouafi/BasicProceduralBuilding
- Pinned ref: `main` @ `f97984d1c2e5fae484a6c7d0dc01f721c117a6ba`
- License signal: MIT repository metadata
- README evidence: TypeScript building configurator; deterministic seed and Blender geometry-node-derived placement; instanced asset kit.
- Realms disposition: **evaluate**
- Fit: Good small reference for deterministic structure templates and future `/ai place` blueprints.
- Smallest experiment: implement one voxel-native hut generator with width/length/height/seed inputs and a server-side block budget.
- Risks: the bundled asset kit and Blender source are separate rights/provenance surfaces; prefer voxel-native geometry for Realms.

## Environment and terrain references

### GrassSystemThreeJS / Soil Studio

- URL: https://github.com/achrefelouafi/GrassSystemThreeJS
- Pinned ref: `main` @ `b236b2a38d9f35daa2ddc7b0152544b10e6350c`
- License signal: MIT repository metadata
- README evidence: GPU-instanced grass following a procedural terrain height field, coherent wind, moss/soil shading, volumetric clouds, and post-processing.
- Realms disposition: **reference-only initially**
- Fit: informs wind fields, terrain-following foliage, and graphics toggles. The current scene should first use a cheaper instanced grass layer.
- Smallest experiment: prototype a single instanced grass patch with the existing `groundHeight` function and a hard instance/distance budget.
- Risks: textures, volumetric clouds, post-processing, and GPU-heavy displacement are not appropriate as an unbounded chunk feature.

### VegetationGeneratorThreeJS

- URL: https://github.com/achrefelouafi/VegetationGeneratorThreeJS
- Pinned ref: `main` @ `f6c26004c0763011248a65725a56ed28339fdf91`
- License signal: MIT repository metadata
- README evidence: TypeScript/WebGPU ivy generator with WebGL2 fallback; surface painting, branches, drooping over edges, and instanced leaves.
- Realms disposition: **reference-only / later evaluate**
- Fit: surface-following growth could inform vines or magical vegetation on authored structures.
- Smallest experiment: no production integration yet; first isolate a low-poly vine generator with a fixed segment/leaf cap.
- Risks: WebGPU and dynamic growth are a poor first fit for chunk streaming and multiplayer authority.

### WaterThreeJS

- URL: https://github.com/achrefelouafi/WaterThreeJS
- Pinned ref: `main` @ `4f85f4a557da80a1dd24b9243869177f30c604c7`
- License signal: MIT repository metadata
- README evidence: procedural Gerstner waves, screen-space reflections, detail normals, Fresnel/refraction, and underwater caustics/volumetric light.
- Realms disposition: **defer; reference for a bounded water surface**
- Fit: useful if Realms adds lakes/coastlines, but start with a single bounded water material rather than SSR across the whole scene.
- Smallest experiment: one water plane around the spawn region with reflection/refraction disabled by default and a graphics toggle.
- Risks: depth textures, render targets, and per-frame shader cost on low-end browsers.

### OceanThreejs

- URL: https://github.com/achrefelouafi/OceanThreejs
- Pinned ref: `main` @ `da18e9254a83a6e990c0077b5d752026f3d5c480`
- License signal: MIT repository metadata
- README evidence: hybrid FFT/Gerstner waves, GGX water BRDF, procedural foam, HDR reflections, and depth refraction; standalone WebGL2 renderer.
- Realms disposition: **defer / reference-only**
- Fit: future ocean realm or cinematic menu scene, not the ordinary voxel world.
- Smallest experiment: compare a cheap Gerstner-only material against the current renderer in a disposable scene.
- Risks: the repository explicitly has no terrain, gameplay, or boat integration; high integration and performance cost.

### realistic-forest weather and atmospheric ideas

The forest repository is also the preferred low-risk source for atmosphere and weather presentation. Keep this separate from the dedicated storm simulation below; Realms should not import a full cinematic weather renderer before it has a graphics budget and quality tiers.

## Weather references

### RainSystemThreeJS

- URL: https://github.com/achrefelouafi/RainSystemThreeJS
- Pinned ref: `main` @ `6d13106d35bfd3a363f85685d90f0e88f83fdd3b`
- License signal: MIT repository metadata
- README evidence: repository README is minimal in the fetched surface; metadata indicates a large JavaScript Three.js project.
- Realms disposition: **evaluate later**
- Fit: bounded camera-relative rain particle layer, likely useful after settings/quality tiers.
- Smallest experiment: implement a low-count camera-relative rain field with no terrain mutation and a settings toggle.
- Risks: limited README evidence in this pass; source inspection and runtime verification are required before promotion.

### SnowSystemThreeJS

- URL: https://github.com/achrefelouafi/SnowSystemThreeJS
- Pinned ref: `main` @ `c7a3bfbd10c93f8d7b032c322c99b38326edeb80`
- License signal: MIT repository metadata
- README evidence: GPU-instanced snowfall, camera-wrapped flakes, world-space accumulation mask, cinematic post-processing, and GUI controls.
- Realms disposition: **reference-only / evaluate later**
- Fit: snowfall overlay and biome presentation; do not add shader-based accumulation until terrain mutation and persistence semantics are settled.
- Smallest experiment: camera-relative flakes only, with no persistent accumulation and an explicit quality cap.
- Risks: accumulation can visually disagree with voxel state; post-processing and texture dependencies need separate review.

### natural-disasters / ABYSSAL

- URL: https://github.com/Token-Gremlin/natural-disasters
- Pinned ref: `main` @ `d2bae38301ff43bc1d43bfdfd9477a552ca5420b`
- License signal: MIT repository metadata
- README evidence: procedural ocean and extreme-weather simulation; FFT waves, volumetric clouds, hurricanes, tsunamis, GPU-generated output, no external assets.
- Realms disposition: **defer / inspiration only**
- Fit: future world-event or cinematic showcase, not a baseline gameplay feature.
- Smallest experiment: extract only a bounded storm-cloud/lightning effect in a disposable scene after the VFX budget exists.
- Risks: large scope, WebGL2/GLSL3 constraints, and likely conflict with chunked voxel rendering and multiplayer determinism.

## Character and combat references

### SoldierThirdPersonThreeJS

- URL: https://github.com/achrefelouafi/SoldierThirdPersonThreeJS
- Pinned ref: `main` @ `814a5631aaff1fdb0623be8e1e9356fefe772b43`
- License signal: MIT repository metadata
- README evidence: third-person action stage with procedural landscape, locomotion, motion-warped melee, thrown abilities, shoulder-camera shooter, ragdoll deaths, and equipment studio.
- Realms disposition: **reference-only**
- Fit: informs camera feel, melee timing, ability telegraphs, and animation state separation.
- Smallest experiment: compare one melee wind-up/contact/recovery timing model against current player controls without importing its character/assets.
- Risks: 77 MB repository size signal and a different action-game architecture; do not replace the current voxel movement/server protocol.

## Procedural building references

### BuildingGeneratorThreeJS

- URL: https://github.com/achrefelouafi/BuildingGeneratorThreeJS
- Pinned ref: `main` @ `74cb71b0db1efa894a9763fba3ae67ca8ea54547`
- License signal: MIT repository metadata
- README evidence: TypeScript procedural Hong Kong building generator, Blender node-group reverse engineering, instanced asset kit, and many exposed parameters.
- Realms disposition: **reference-only until asset audit**
- Fit: parameterized building grammar and reproducible seed ideas for future authored landmark generation.
- Smallest experiment: port only the parameter schema/seed logic to voxel blocks; do not copy the bundled kit until every asset and linked Sketchfab source is cleared.
- Risks: linked third-party model provenance may not match the repository MIT signal; architecture is much denser than Realms’ low-poly voxel language.

## Other effect reference

### LinearAbilityExtThreeJS and GeometryPainterThreeJS together

These two are the most promising pair for the next combat-graphics slice: LinearAbility supplies readable cast/target sequencing, while GeometryPainter supplies surface-attached growth and impact language. The integration boundary should be project-owned factories returning disposable `THREE.Group` instances; authoritative hit detection, damage, block edits, and cooldowns stay on the server.

## Research guardrails

- Do not wholesale-copy demo applications into Realms.
- Pin a commit before implementation and preserve the upstream URL/ref beside any adapted code.
- Repository license and bundled asset license are separate checks.
- Prefer technique extraction over runtime dependency additions.
- Test WebGPU candidates with the existing WebGL2 path before considering them.
- Keep all effects bounded by chunk, distance, lifetime, instance count, and graphics quality tier.
- Do not let visual effects own authoritative world state.
- Treat README claims as discovery evidence until source, build, and browser runtime gates are run.
