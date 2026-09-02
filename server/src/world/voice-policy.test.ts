import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVoiceClip, VOICE_LIMITS } from '../../../server/src/voice/audioPolicy';

test('voice policy accepts bounded supported clips', () => {
  const result = validateVoiceClip({ bytes: Buffer.alloc(128), mimeType: 'audio/webm', durationMs: 1200 });
  assert.equal(result.ok, true);
});

test('voice policy rejects unsupported, oversized, and overlong clips', () => {
  assert.equal(validateVoiceClip({ bytes: Buffer.alloc(4), mimeType: 'audio/wav', durationMs: 100 }).ok, false);
  const oversized = validateVoiceClip({ bytes: Buffer.alloc(VOICE_LIMITS.maxBytes + 1), mimeType: 'audio/webm', durationMs: 100 });
  const overlong = validateVoiceClip({ bytes: Buffer.alloc(4), mimeType: 'audio/webm', durationMs: VOICE_LIMITS.maxDurationMs + 1 });
  assert.equal(oversized.ok, false);
  assert.equal(overlong.ok, false);
  if (!oversized.ok) assert.equal(oversized.reason, 'clip too large');
  if (!overlong.ok) assert.equal(overlong.reason, 'clip too long');
});
