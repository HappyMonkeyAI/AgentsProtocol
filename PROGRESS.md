# MRPG Realms Progress

Newest entries first. This is the implementation slice journal; durable rules live in `CONTEXT.md`, product scope in the plan, and architecture decisions live in ADRs.

## 2026-09-02 — seeded foliage wind motion

- Added deterministic per-plant wind phase and amplitude data to the existing tree and grass groups.
- Loaded landscape chunks now receive bounded rooted sway using the shared render clock; plant bases remain anchored to their terrain height.
- Starter showcase foliage uses the same lifecycle-safe animation path.
- No terrain, block, multiplayer, or persistence state is changed by the visual animation.
- Verification: typecheck passed, all 18 tests passed, build passed, diff checks passed, and managed `/health` returned HTTP 200.

## 2026-09-02 — mage impact combat effect

- Extended the server-confirmed `CombatEffect` contract with a target-centered `impact` kind for mage damage.
- Warrior and ranger damage retain the slash arc; healer support hits remain free of damaging effects.
- Added a bounded 500 ms low-poly magical impact group with fade, rotation, scale animation, and explicit resource disposal.
- Verification: typecheck passed, all 18 tests passed, build passed, diff checks passed, and live two-client Socket.IO smoke observed both slash and impact broadcasts.

## 2026-09-02 — server-confirmed combat slash effect

- Added the shared `CombatEffect` contract and server `combat:effect` event.
- Valid damaging hits now emit a slash event after range/role validation; healer support hits do not emit a damaging slash.
- Added a client-owned, low-poly torus-arc effect with a 420 ms lifetime, fade/scale animation, and explicit geometry/material disposal.
- Visual presentation remains non-authoritative: HP mutation, range checks, and hit validity stay on the server.
- Verification: typecheck passed, all 18 tests passed, build passed, diff checks passed, and a real two-client Socket.IO smoke observed one valid slash event plus one HP event.

## 2026-09-02 — Three.js reference links curated

- Added `docs/research/LINKS.md` with pinned default-branch commits, README-derived technique notes, license signals, Realms fit, dispositions, and smallest safe experiments for the supplied repositories.
- Highest-value candidates are `LinearAbilityExtThreeJS` and `GeometryPainterThreeJS` for bounded spell/slash effects, `realistic-forest` for grounded foliage/atmosphere, and `BasicProceduralBuilding` for deterministic voxel-native structure grammars.
- Heavy ocean, weather, WebGPU, and cinematic post-processing projects remain reference/deferred until graphics budgets and quality tiers exist.
- No repository was cloned, executed, or added as a runtime dependency in this research pass.

## 2026-09-02 — voice reliability follow-up noted

- Playtesting found the transcription and speech playback path intermittent across capture, provider, browser-permission, autoplay, and timing boundaries.
- The current voice path remains an optional experimental accessibility feature; typed chat remains the reliable baseline.
- Added a proposed ADR to evaluate a pure live microphone channel separately from speech-to-text plus speech synthesis.
- Required follow-up: stage instrumentation and a real two-client browser fixture before judging whether live voice should replace or complement the current MVP.

## 2026-09-02 — Bedrock world save inspection

- Inspected the uploaded `world/` copy: Bedrock metadata in `level.dat` plus approximately 23 MB of binary LevelDB data under `world/db/`.
- Confirmed the save is useful as a format/reference source but should not become MRPG's native persistence layer.
- Documented the proposed MRPG boundary: versioned manifest, sparse authoritative voxel edits, structures, player profiles, and atomic recovery writes.
- Added `world/` to `.gitignore` so the uploaded save cannot be staged accidentally.
- Detailed findings: `docs/research/bedrock-world-save-inspection.md`.

## 2026-09-01 — landscape dressing follows realm terrain lifecycle

- Fixed floating trees/grass after realm seed changes.
- Cause: voxel meshes were removed on seed reset, but old `landscapeChunks` groups remained in `worldRoot`, retaining heights from the previous heightfield.
- Fix: seed reset now removes and clears landscape groups before rebuilding terrain and dressing for the new seed.
- Verification: `npm run typecheck` passed, `npm test` passed with 18 tests, `npm run build` passed, and `git diff --check` passed.

## 2026-09-01 — Voice auto-send, recipient playback, and lifecycle hardening

- Voice transcripts now auto-send as ordinary room chat; the old review popup is no longer part of the normal voice flow.
- Voice-originated messages use a server-owned `voice:send-transcript` event and are marked in the shared chat contract; generic clients cannot self-label typed chat as voice.
- Recipients with incoming voice and browser TTS enabled hear the sender name and transcript through `speechSynthesis`; the sender does not hear their own message repeated.
- Fixed the asynchronous microphone-start race where releasing before `getUserMedia()` resolved could start a recorder after release.
- Slash-like voice transcripts remain blocked from automatic command execution.
- Browser-native recognition remains environment-dependent: Brave was manually observed working; Edge reported that browser recognition could not start. Server transcription remains the portable path when configured.
- Verification: `npm run typecheck` passed, `npm test` passed with 18 tests, `npm run build` passed, `git diff --check` passed, and production `/health` returned HTTP 200 after restart.

Deferred: queue incoming TTS instead of cancelling an active utterance during rapid voice-message bursts; add browser-level two-client voice/TTS acceptance coverage.

## 2026-09-01 — Phase 2 voice transcription provider

- Added bounded push-to-talk capture (`T` while chat is closed, or the visible chat button while chat is open) with a 10-second cap, supported MIME filtering, microphone permission handling, cancellation, and typed-chat fallback.
- Added the initial review-before-send transcript UI; voice text is never executed as a slash command automatically.
- Added server-side voice clip validation, per-socket transcription rate limiting, and explicit unavailable/rejected responses.
- Added a real Google Cloud Speech-to-Text v2 provider adapter using server-only service-account JWT exchange, cached OAuth tokens, bounded request payloads, and transcript parsing.
- Added provider boundary tests with generated ephemeral credentials and a fetch seam; production remains safely disabled until credentials are configured.

## 2026-09-01 — Phase 1 command registry and settings

- Added a typed shared command registry with client/server execution metadata and registry-generated command help.
- Added versioned local settings with sanitization, persistence, subscriptions, and graceful storage failure handling.
- Added an accessible General, Voice, and Accessibility settings modal with focus trapping, Escape close, and persisted chat/voice/accessibility controls.
- Wired chat timestamps/history limits and gameplay key suppression while settings are open.
- Verification: 12 tests passed, typecheck passed, production build passed, and live browser acceptance confirmed settings open, persistence after reload, and no console errors.

## 2026-09-01 — HTTPS transport and favicon production fix

- Fixed production Socket.IO URL resolution so HTTPS deployments use same-origin secure WebSockets instead of the development port fallback.
- Added a favicon asset and ensured deployment preserves its nginx-readable permissions.
- Rebuilt and restarted the remote production service; verified the public game, chat overlay, `/help`, favicon, and zero browser console errors.

## 2026-09-01 — Enter chat overlay and seed-room chat foundation

Implemented the first social interaction slice for the planned chat/voice/AI roadmap:

- Replaced the top debug console UI with a bottom Minecraft-inspired chat overlay opened by Enter and closed by Escape.
- Added typed slash-command parsing and local `/help`, `/help controls`, `/help commands`, `/help voice`, `/help ai`, `/creative`, and `/survival` responses.
- Added server-authoritative, seed-room-scoped ordinary chat with sender identity, text limits, and a per-socket rate limit.
- Added shared `ChatMessage` and command parsing contracts, plus focused chat tests.
- Updated the automated test script and browser testing checklist to include the new chat path.

Verification:

- `npm test` — 6 tests passed
- `npm run typecheck` — passed
- `npm run build` — passed (Vite emitted the existing bundle-size warning)
- Socket.IO two-room smoke — same-room delivery passed; cross-room isolation passed
- `GET http://127.0.0.1:9402/health` — HTTP 200
- Browser navigation through the current browser tool was blocked for the private localhost URL; browser visual acceptance remains to be run in a connected local/LAN browser.

## 2026-08-31 — authored landscape, tunnel collision, and creative flight controls

Shipped on `feature/agent-worktree-infrastructure`:

- Added seeded low-poly tree and grass dressing in `client/src/landscape.ts`.
- Added authored chest/player/sword blockouts and asset provenance notes.
- Added edited-column-aware terrain collision.
- Survival movement now resolves support from the solid block beneath the player rather than snapping to the highest surface in a column. Open tunnels can therefore be occupied and mined downward.
- Creative flight supports `Space`/`E` up and `Q`/`Ctrl` down.
- Creative `Ctrl+W` is prevented from reaching the browser close-tab shortcut.

Key files:

- `client/src/main.ts`
- `client/src/landscape.ts`
- `client/src/assets/factories.ts`
- `client/src/assets/manifest.ts`
- `docs/research/authored-asset-blockouts.md`

Verification:

- `npm run typecheck` — passed
- `npm test` — 4 tests passed
- `npm run build` — passed
- `git diff --check` — passed
- `GET http://127.0.0.1:9402/health` — HTTP 200
- Socket.IO polling handshake — HTTP 200
- Browser smoke previously confirmed join, creative mode, HUD state, movement, and no page errors. The later fresh harness run was blocked by a native connection-error alert before its new Ctrl+W assertion completed; do not treat that run as browser acceptance evidence.

Deferred:

- Replace runtime blockouts with reviewed rights-cleared authored assets.
- Add flowers, rocks, landmark props, and instanced foliage at scale.
- Add a deterministic browser test that mines a support block and verifies falling into the resulting tunnel.

## 2026-08-29 — project scaffold and visual voxel prototype

- Three.js/Vite client and Node/Express/Socket.IO server established.
- Seeded procedural terrain, chunk streaming, multiplayer seed rooms, combat roles, structures, and creative debug console wired as prototype systems.
- Full project gates remain `npm run typecheck`, `npm test`, and `npm run build`.

See `docs/plans/2026-08-29-mrpg-realms.md` for the phased roadmap and acceptance gates.
