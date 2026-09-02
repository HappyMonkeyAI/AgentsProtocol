export const VOICE_LIMITS = {
  maxBytes: 1024 * 1024,
  maxDurationMs: 10_000,
  maxTextLength: 240,
  allowedMimeTypes: ['audio/webm', 'audio/ogg', 'audio/mp4'] as readonly string[],
};

export interface VoiceClipInput {
  bytes: Uint8Array;
  mimeType: string;
  durationMs: number;
}

export type VoiceClipPolicyResult = { ok: true } | { ok: false; reason: string };

export function validateVoiceClip(input: VoiceClipInput): VoiceClipPolicyResult {
  if (!VOICE_LIMITS.allowedMimeTypes.includes(input.mimeType)) return { ok: false, reason: 'unsupported audio type' };
  if (!input.bytes || input.bytes.byteLength === 0) return { ok: false, reason: 'empty clip' };
  if (input.bytes.byteLength > VOICE_LIMITS.maxBytes) return { ok: false, reason: 'clip too large' };
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) return { ok: false, reason: 'invalid duration' };
  if (input.durationMs > VOICE_LIMITS.maxDurationMs) return { ok: false, reason: 'clip too long' };
  return { ok: true };
}
