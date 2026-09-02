# Chat, Voice, Settings, and AI Building Roadmap

> **For Hermes:** Use subagent-driven-development to implement this roadmap task-by-task after each phase is accepted.

**Goal:** Replace the client-only backtick debug console with a Minecraft-style bottom chat/command overlay, then add opt-in multiplayer voice, reusable settings, and a safe server-authoritative `/ai place` building pipeline.

**Architecture:** Keep Socket.IO and `shared/protocol.ts` as the multiplayer boundary. The browser owns presentation, input capture, local preferences, raycast context, and audio playback; the Node server owns room-scoped chat delivery, command authorization, voice transcription/TTS mediation, AI requests, blueprint validation, and final world mutations. AI never emits arbitrary client geometry or directly edits the scene.

**Tech Stack:** Existing TypeScript/Vite/Three.js client, Node/Express/Socket.IO server, shared TypeScript protocol, browser `MediaRecorder`/`getUserMedia`, optional Google Cloud Speech-to-Text and Text-to-Speech, and an OpenAI-compatible LM Studio endpoint configured server-side.

---

## Founder reality check

- The current console in `client/src/main.ts:149-193` is client-only and only implements `/creative` and `/survival`. It can be migrated into a player-facing command surface without changing the existing world protocol.
- The current server has seed-scoped Socket.IO rooms and authoritative structure placement in `server/src/index.ts:68-149`, but no chat, voice, command, persistence, or AI boundary yet.
- Browser microphone capture requires a secure context. `localhost` is suitable for local testing; LAN use should be HTTPS with a certificate covering the LAN address. Voice must remain an optional enhancement: typed chat and gameplay cannot depend on microphone access, Google credentials, or an LLM.
- Google Cloud credentials must never reach the browser. The server should receive short-lived audio, call the configured provider, discard raw audio by default, and broadcast only the approved transcript/audio result.
- The LM Studio endpoint at `http://192.168.5.229:1234/v1` is a deployment/configuration input, not a client setting or hard-coded dependency. The server must tolerate it being unavailable and return a visible command error.

## Product decisions to make now

1. **Chat scope:** default to world-room chat only. Add direct messages later after identity, blocking, and moderation rules exist.
2. **Voice MVP:** push-to-talk creates a transcript that is automatically broadcast as a chat message. Browser speech synthesis is the first playback fallback for recipients who opt in; server-generated audio is a later quality/consistency lane.
3. **Voice privacy:** voice is opt-in, visibly listening only while the key is held, never uploads while muted, stores no raw audio, and has an incoming voice mute setting.
4. **AI placement:** begin with a bounded catalog of named structures and deterministic templates. Then permit an LLM to propose a validated block blueprint. A free-form request such as “statue of liberty” is a request for a capped approximation, not permission to generate unbounded geometry.
5. **Authoritative placement:** the server receives a target/orientation and blueprint, re-checks builder permission, bounds, support, overlap, block budget, cooldown, and world-room ownership, then broadcasts one accepted structure/voxel mutation.
6. **Settings storage:** gameplay/audio preferences are local browser preferences initially. Server policy/settings such as AI availability, provider mode, rate limits, and maximum blueprint size are environment configuration, never client-controlled authority.

---

## Phase 0 — Command and chat foundation

**Objective:** Make Enter open a bottom chat overlay and route typed `/commands` and ordinary messages through one command/message pipeline.

**Files:**
- Modify: `client/index.html` — replace or wrap the existing console markup with a bottom chat panel, history list, input, close state, and visible status labels.
- Modify: `client/src/main.ts` — replace the console event path, add Enter/Escape focus behavior, preserve Backquote as a development-only compatibility shortcut during migration, and prevent gameplay keys while the overlay is focused.
- Modify: `client/index.html:7-34` — extend the current inline stylesheet with a Minecraft-inspired panel, pixel/stone/wood tokens, readable contrast, responsive layout, and reduced-motion behavior.
- Modify: `shared/protocol.ts` — typed `ChatMessage`, command request/result, sender metadata, and protocol event names.
- Modify: `server/src/index.ts` — validate, rate-limit, sanitize, and broadcast world-room chat; return command results to the issuing socket.
- Create: `client/src/chat.ts` — history model, rendering, input state, command submission, and accessibility behavior.
- Test: `server/src/world/chat.test.ts` or the repository’s established server test location.

**Commands and help contract:**
- `/help` lists command groups.
- `/help controls` lists movement, camera, mining, placement, attack, and overlay keys.
- `/help commands` lists available commands and examples.
- `/help voice` explains opt-in voice capture, mute, secure-context, and browser support.
- `/help ai` explains supported placement syntax, caps, confirmation, and failure behavior.
- `/creative` and `/survival` remain available as local development commands until a dedicated admin/debug path replaces them.
- Unknown commands produce a local error message and do not get broadcast as chat.
- Ordinary text is sent as room chat and appears for all players in the same seed room only.

**Acceptance gate:** Two real Socket.IO clients in different seed rooms cannot see each other’s chat; same-room messages preserve sender name and role; Enter opens the overlay; Escape closes it; focus is visible; movement/click actions do not fire while typing; `/help controls` renders the actual current bindings; no console/page errors.

---

## Phase 1 — Command registry and Minecraft-style settings

**Objective:** Make help, settings, and future features use typed registries instead of scattered keyboard/command conditionals.

**Files:**
- Create: `shared/commands.ts` — command IDs, aliases, usage, help groups, permission requirements, and client/server execution classification.
- Create: `client/src/settings.ts` — typed local preference model, defaults, load/save, change event, and migration version.
- Modify: `client/index.html` — settings button and modal with General, Voice, and Accessibility tabs.
- Modify: `client/src/main.ts` and `client/src/chat.ts` — consume the command registry and settings manager.
- Modify: `client/index.html:7-34` — add Minecraft-themed modal, tabs, toggles, sliders, focus trap, and reduced-motion styles to the existing inline stylesheet.
- Test: command registry and settings unit tests.
- Modify: `docs/TESTING.md` — keyboard, focus, persistence, and settings acceptance steps.

**Initial settings:**
- Incoming voice enabled/muted.
- Voice transcription enabled/disabled.
- Voice playback volume.
- Browser TTS fallback enabled/disabled.
- Chat timestamps and chat history length.
- Reduced motion.
- Optional confirmation for `/ai place`.

Do not put Google credentials, LM Studio API keys, or server policy values in localStorage. If a provider status is shown, expose only enabled/disabled and a sanitized error category.

**Acceptance gate:** Reload preserves preferences; settings can disable incoming voice without affecting typed chat; modal traps focus and closes on Escape; `/help` content is generated from the same command registry; narrow viewport remains usable.

---

## Phase 2 — Browser push-to-talk transcription (shipped; provider remains optional)

**Objective:** Add opt-in hold-to-talk capture that produces an automatically sent ordinary chat transcript without making voice a gameplay dependency.

**Recommended interaction:** Hold `T` only while chat is closed, or hold the visible microphone button while chat is open; show “Listening” and a live duration; release stops capture and submits one bounded audio clip. Ordinary transcripts auto-send; slash-like transcripts remain blocked from automatic execution. Do not use always-on listening or a wake word in the first multiplayer slice.

**Files:**
- Create: `client/src/voiceCapture.ts` — feature detection, user-gesture permission, `MediaRecorder`, MIME selection, maximum duration, cancellation, and visible permission/error state.
- Modify: `client/src/chat.ts` — microphone control, automatic transcript send, incoming browser playback, and voice status announcements.
- Modify: `shared/protocol.ts` — voice request/result envelopes and transcript metadata.
- Modify: `server/src/index.ts` — authenticated-by-socket voice upload boundary, room ownership checks, rate/size limits, and transcript broadcast.
- Create: `server/src/voice/transcription.ts` — provider interface plus Google implementation behind environment configuration.
- Create: `server/src/voice/audioPolicy.ts` — MIME/size/duration validation and raw-audio disposal policy.
- Modify: `.env.example` — provider mode and non-secret configuration names only; never add credential values.
- Test: capture policy, command/message routing, rate limits, provider-unavailable fallback, and room isolation.

**Provider contract:** Keep `TranscriptionProvider` independent of Google. The first implementation may use Google Cloud Speech-to-Text, but the server must return a typed “voice unavailable” result when credentials, secure context, browser support, or provider access is missing. Ordinary transcripts are plain text and auto-send through the room-chat path; `/` commands remain blocked from automatic execution and require manual typed confirmation.

**Security and abuse controls:** cap clip duration and bytes, reject unsupported MIME types, rate-limit per socket and room, sanitize transcript length, never execute arbitrary transcribed text as a command without the existing command parser, and do not persist raw audio by default.

**Acceptance gate:** On HTTPS or localhost, a permitted browser can hold/release the control and receive an automatically sent transcript; denied permission gives a visible non-fatal error; unsupported browsers retain typed chat; no audio is captured when muted; same-room transcript delivery is isolated by seed; raw audio is not written to disk.

---

## Phase 3 — Voice playback and incoming voice controls (MVP partially shipped)

**Objective:** Let connected players hear approved voice messages with privacy-respecting fallbacks.

**Two-step rollout:**
1. **MVP:** broadcast transcript text and use `speechSynthesis` only when the receiver has enabled browser TTS. Keep displayed text and spoken text separate; the current implementation cancels an active utterance on a new voice message, with queueing deferred.
2. **Quality lane:** add server-side Google Text-to-Speech returning short-lived audio bytes or an internal media URL. Broadcast a voice message ID and metadata, not provider credentials. The receiver downloads/plays only when incoming voice is enabled.

**Files:**
- Create: `client/src/voicePlayback.ts` — browser TTS/audio playback, queue policy, mute/volume state, autoplay/user-gesture handling, and cleanup.
- Create: `server/src/voice/synthesis.ts` — provider interface and Google TTS adapter, with bounded text and audio output.
- Modify: `shared/protocol.ts` — `voice:message` metadata and expiry fields.
- Modify: `client/src/settings.ts`, `client/src/chat.ts`, and settings markup — mute/volume/voice mode controls.
- Test: playback disabled, provider unavailable, bounded text, expiry, and queue behavior.

**Acceptance gate:** A receiver can mute voice while still seeing transcript chat; playback never starts before opt-in/user gesture where the browser requires it; provider failures degrade to text; credentials are server-only; clear voice indicators appear in the chat history.

---

## Phase 4 — Server-authoritative AI placement v1: templates

**Objective:** Deliver `/ai place house`, `/ai place castle`, `/ai place temple`, and `/ai place statue of liberty` as bounded, deterministic block structures before introducing an LLM.

**Files:**
- Create: `shared/blueprint.ts` — versioned block blueprint schema, dimensions, orientation, material IDs, and validation limits.
- Create: `server/src/structures/templates.ts` — deterministic templates with explicit block budgets.
- Create: `server/src/structures/placement.ts` — target validation, support/overlap checks, builder authorization, cooldown, and conversion to authoritative world mutations.
- Modify: `server/src/index.ts` — `/ai` command routing and acknowledgement events.
- Modify: `client/src/main.ts` — send camera raycast target/orientation and render accepted blueprint blocks through the existing chunk/structure lifecycle.
- Modify: `shared/protocol.ts` — blueprint request/result and accepted mutation events.
- Test: blueprint schema, template bounds, role permissions, target validation, overlap, rate limits, and room isolation.

**Important targeting rule:** the client may propose the center target from the crosshair, but the server must recompute/check the legal placement against authoritative player state and world rules. If the current server does not yet persist voxel edits/structures, this phase must define whether AI output is a structure-level landmark or a voxel edit batch; it must not imply persistence until Phase 6 adds it.

**Acceptance gate:** Builder can request a named template on a flat valid target; non-builder receives a rejection; invalid/water/occupied/out-of-range targets are rejected; block count and dimensions are capped; placement is visible to every player in the room and cannot leak to another seed room; confirmation is required for large templates.

---

## Phase 5 — AI blueprint generation behind a server adapter

**Objective:** Allow the configured LM Studio OpenAI-compatible endpoint to propose a bounded blueprint while keeping templates as fallback.

**Files:**
- Create: `server/src/ai/provider.ts` — provider-neutral completion interface.
- Create: `server/src/ai/lmStudio.ts` — OpenAI-compatible adapter using server environment variables.
- Create: `server/src/ai/blueprintPrompt.ts` — strict schema prompt, material vocabulary, dimensions, style, and refusal rules.
- Create: `server/src/ai/blueprintValidator.ts` — parse/validate/cap/reject model output; no direct execution of prose.
- Modify: `server/src/index.ts` — asynchronous job lifecycle, timeout, cancellation, and sanitized errors.
- Modify: `.env.example` — `AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL`, timeout and maximum blueprint settings; no secrets.
- Test: fixture responses for valid, malformed, oversized, adversarial, unavailable, and slow provider cases.

**Request flow:**

`/ai place <description>` → client sends target/orientation → server checks player/room → server selects template or calls provider → strict JSON parse → schema/budget/placement validation → optional confirmation → authoritative mutation → room broadcast.

The LLM receives a constrained description plus a small target context, not arbitrary socket state or credentials. Never allow model output to choose socket IDs, owner IDs, room IDs, file paths, URLs, executable code, or unbounded dimensions. Use an idempotency/request ID so retries cannot duplicate a structure.

**Acceptance gate:** LM Studio being offline produces a clear fallback/error; valid fixture output becomes a server-validated blueprint; malformed or oversized output is rejected; the client cannot bypass validation by submitting its own blueprint; request timeout and rate limit work; AI calls never block ordinary chat or movement.

---

## Phase 6 — Persistence, moderation, and production hardening

**Objective:** Make accepted chat/voice/AI behavior safe and durable enough for public multiplayer testing.

**Work:**
- Extend the planned structure persistence from the existing product roadmap so AI-built structures survive restart without duplicating mutations.
- Add per-room message limits, mute/block/report hooks, profanity/spam policy, and bounded chat history. Do not expose private direct messages until these controls exist.
- Add provider health/capability reporting without leaking endpoint credentials.
- Add metrics for command rejection, transcription latency, TTS failures, AI latency, blueprint rejection reasons, and duplicate request IDs; redact message/audio content from logs.
- Add reconnect/resubscription behavior for chat and voice state.
- Add HTTPS LAN startup/certificate documentation following the existing browser voice workflow.
- Add Playwright coverage for join → Enter chat → `/help controls` → same-room chat → settings mute → voice permission failure → AI template placement, with zero console/page errors.

**Final gate:** `npm run typecheck`, `npm test`, `npm run build`, managed stack health check, two-room Socket.IO isolation test, HTTPS LAN voice permission test, and browser acceptance on desktop plus a narrow viewport. Missing Google/LM Studio services are tested as graceful degradation, not silently treated as success.

---

## Suggested delivery order

1. Phase 0: typed room chat + Enter overlay + `/help` (shipped).
2. Phase 1: settings and registry cleanup (shipped).
3. Phase 2: push-to-talk transcript and auto-send (shipped; cloud provider optional).
4. Phase 3: optional recipient playback and mute controls (MVP partially shipped; queueing/server TTS deferred).
5. Phase 4: deterministic AI-named templates.
6. Phase 5: LM Studio blueprint adapter.
7. Phase 6: persistence, moderation, observability, and broader browser coverage.

This order proves the social/gameplay loop before adding paid/cloud speech or probabilistic generation, and keeps every external dependency behind a reversible adapter.

## Known risks and mitigations

- **Current movement is client-authoritative:** do not make AI placement trust client position/target; add stronger server checks before public use.
- **No current voxel-edit server protocol:** represent AI structures through an explicit versioned mutation contract and extend persistence before promising restart survival.
- **Speech browser variance:** feature-detect `MediaRecorder`, secure context, MIME support, and playback; always retain typed chat.
- **Google cost/privacy:** clip/rate/size caps, no raw-audio persistence, provider feature flag, and text-only fallback.
- **LLM hallucinated geometry:** strict JSON schema, fixed material vocabulary, dimensions/block budget, overlap/support validation, confirmation, and templates fallback.
- **Room abuse/noise:** per-socket and per-room limits, sender identity from the socket, bounded history, and future moderation hooks.
- **Backwards compatibility:** keep Backquote/debug behavior temporarily, preserve `/creative` and `/survival`, and remove the legacy console only after browser acceptance covers the replacement.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
./start.sh
curl -sS http://127.0.0.1:9402/health
```

Do not commit provider credentials or `.env`. Do not claim voice or AI provider acceptance when the required Google/LM Studio service is unavailable; use deterministic fixtures and report the external integration gate separately.
