# ADR 0007: Voice chat and browser playback boundaries

- Status: Accepted
- Date: 2026-09-01

## Context

MRPG Realms supports optional push-to-talk input, but browser speech recognition and cloud transcription are environment-dependent. The multiplayer chat path also needs to distinguish a voice-originated message from ordinary typed chat so recipients can opt into local browser playback without making voice a gameplay dependency.

## Decision

- The visible microphone button works while the chat overlay is open.
- The `T` shortcut works only while the chat overlay is closed.
- Capture is bounded to one clip of at most 10 seconds and is cancelled if the user releases the control before microphone acquisition completes.
- Server transcription is attempted first when configured. Browser-native recognition is a progressive fallback and requires browser support, permission, and a suitable secure context.
- Ordinary voice transcripts auto-send as bounded room chat after transcription. There is no normal transcript review popup.
- Voice-originated transcripts use the server-owned `voice:send-transcript` Socket.IO event. The server, not the client, assigns the `voice` marker on the resulting `ChatMessage`.
- Voice-originated slash commands are rejected by the existing command policy and are never executed automatically.
- A recipient may use browser `speechSynthesis` for voice-marked messages when local incoming-voice and browser-TTS settings permit it. The sender's own message is not replayed.
- Typed chat remains available when microphone permission, browser recognition, cloud credentials, or speech synthesis are unavailable.

## Consequences

- No Google credentials are needed for the browser fallback or recipient playback.
- Browser support and autoplay/user-gesture policies can still prevent recognition or playback; the UI must report a non-fatal status and retain typed chat.
- The current recipient playback path cancels an active utterance when a new voice message arrives. Queueing, server-generated TTS, moderation, and broader browser automation remain follow-ups.
- The server's socket identity and chat/voice rate limits remain the authority for room delivery and abuse control.

## Verification

- `npm run typecheck`
- `npm test` (18 tests passing at the time of this decision)
- `npm run build`
- `git diff --check`
- Production `/health` returned HTTP 200 after deployment.
