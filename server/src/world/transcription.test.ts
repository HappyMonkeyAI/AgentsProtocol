import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GoogleTranscriptionProvider, createTranscriptionProvider } from '../../../server/src/voice/transcription';

test('provider reports graceful unavailability without credentials', async () => {
  const result = await createTranscriptionProvider({ VOICE_PROVIDER: 'google' }).transcribe({ audio: new Uint8Array([1]), mimeType: 'audio/webm' });
  assert.deepEqual(result, { error: 'voice provider credentials are unavailable' });
});

test('voice remains unavailable when no provider is configured', async () => {
  const result = await createTranscriptionProvider({}).transcribe({ audio: new Uint8Array([1]), mimeType: 'audio/webm' });
  assert.deepEqual(result, { error: 'voice transcription is not configured' });
});

test('google provider is selected when server-side configuration is present', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const directory = mkdtempSync(join(tmpdir(), 'mrpg-voice-'));
  const credentialsPath = join(directory, 'service-account.json');
  writeFileSync(credentialsPath, JSON.stringify({ client_email: 'voice@example.test', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) }));
  const provider = createTranscriptionProvider({
    VOICE_PROVIDER: 'google',
    GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
    GOOGLE_CLOUD_PROJECT: 'realm-test',
  });
  assert.equal(provider.constructor.name, 'GoogleTranscriptionProvider');
});

test('google provider exchanges a service-account assertion and parses a transcript', async () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const requests: Array<{ url: string; body: string }> = [];
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), body: String(init?.body || '') });
    if (String(input).includes('oauth2')) return new Response(JSON.stringify({ access_token: 'test-token', expires_in: 3600 }), { status: 200 });
    return new Response(JSON.stringify({ results: [{ alternatives: [{ transcript: 'hello realm' }] }] }), { status: 200 });
  };
  const provider = new GoogleTranscriptionProvider(
    { client_email: 'voice@example.test', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() },
    { project: 'realm-test', fetcher },
  );
  assert.deepEqual(await provider.transcribe({ audio: new Uint8Array([1, 2, 3]), mimeType: 'audio/webm' }), { text: 'hello realm' });
  assert.equal(requests.length, 2);
  assert.match(requests[0].body, /grant_type=/);
  assert.match(requests[1].body, /AQID/);
});
