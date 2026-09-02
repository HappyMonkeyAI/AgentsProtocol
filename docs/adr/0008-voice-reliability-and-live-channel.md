# ADR 0008: Voice reliability and live channel follow-up

- Status: Proposed follow-up
- Date: 2026-09-02

## Context

The first voice MVP combines push-to-talk capture, speech transcription, automatic chat delivery, and optional browser speech synthesis. Playtesting found that transcription and playback were intermittent: a clip may fail to start, fail to transcribe, or fail to play depending on browser permissions, secure-context support, provider availability, autoplay policy, and timing.

This means the current path is useful as an experiment, but should not yet be treated as the dependable multiplayer voice experience.

## Decision

- Keep typed chat as the reliable baseline.
- Keep push-to-talk transcription as an explicitly experimental/optional feature until its failure rate and browser/provider coverage improve.
- Do not automatically execute transcribed slash commands.
- Track transcription, transcript delivery, and playback as separate reliability stages so failures are visible and diagnosable.
- Evaluate a pure live microphone channel as a separate product path rather than assuming speech-to-text plus speech synthesis is equivalent to voice chat.

## Live-channel evaluation criteria

A live voice channel should be prototyped only after confirming:

- WebRTC or an equivalent low-latency transport is acceptable for the deployment topology.
- Room membership and cross-room isolation remain server-authoritative.
- Microphone mute, receiver mute, permission denial, disconnect, and reconnect are explicit states.
- Abuse controls exist: participant limits, mute/block/report, and future moderation hooks.
- The experience degrades cleanly to typed chat when media permissions or transport fail.
- Browser acceptance covers two real clients, not only mocked Socket.IO events.

## Consequences

- The current transcription path remains valuable for accessibility and hands-free text, but it is not a substitute for live voice.
- A live channel may provide a more natural experience and avoid transcription/TTS round-trip failures, but introduces WebRTC signaling, NAT/LAN topology, audio device, privacy, moderation, and bandwidth concerns.
- A decision to ship live voice should follow a small two-client spike with measured join latency, packet/track failures, mute semantics, and cross-room isolation.

## Verification and follow-up

- Add instrumentation for capture-start, transcription result, transcript send, receive, playback start, and playback error.
- Add a two-client browser test fixture for the current transcription/playback flow.
- Build a disposable live-channel spike after the persistence and current voice reliability baselines are understood.
- Compare success rate and perceived latency before replacing or expanding the current MVP.
