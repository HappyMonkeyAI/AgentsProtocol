import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

export interface TranscriptionInput {
  audio: Uint8Array;
  mimeType: string;
}

export interface TranscriptionProvider {
  transcribe(input: TranscriptionInput): Promise<{ text: string } | { error: string }>;
}

type Fetcher = typeof fetch;
interface GoogleCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
}

function base64Url(value: string | Uint8Array): string {
  return Buffer.from(value).toString('base64url');
}

function createServiceAccountAssertion(credentials: GoogleCredentials, nowSeconds: number): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  return `${unsigned}.${signer.sign(credentials.private_key, 'base64url')}`;
}

export class GoogleTranscriptionProvider implements TranscriptionProvider {
  private accessToken: { value: string; expiresAt: number } | null = null;
  private readonly project: string;
  private readonly location: string;
  private readonly language: string;
  private readonly fetcher: Fetcher;

  constructor(private readonly credentials: GoogleCredentials, options: { project?: string; location?: string; language?: string; fetcher?: Fetcher } = {}) {
    this.project = options.project || credentials.project_id || '';
    this.location = options.location || 'global';
    this.language = options.language || 'en-US';
    this.fetcher = options.fetcher || fetch;
  }

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) return this.accessToken.value;
    const assertion = createServiceAccountAssertion(this.credentials, Math.floor(Date.now() / 1000));
    const response = await this.fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    });
    if (!response.ok) throw new Error(`oauth token request failed (${response.status})`);
    const payload = await response.json() as { access_token?: string; expires_in?: number };
    if (!payload.access_token) throw new Error('oauth token response did not contain an access token');
    this.accessToken = { value: payload.access_token, expiresAt: Date.now() + (payload.expires_in || 3600) * 1000 };
    return payload.access_token;
  }

  async transcribe(input: TranscriptionInput): Promise<{ text: string } | { error: string }> {
    if (!this.project) return { error: 'Google Cloud project is not configured' };
    try {
      const accessToken = await this.token();
      const endpoint = `https://speech.googleapis.com/v2/projects/${encodeURIComponent(this.project)}/locations/${encodeURIComponent(this.location)}/recognizers/_:recognize`;
      const response = await this.fetcher(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          config: { autoDecodingConfig: {}, languageCodes: [this.language], model: 'latest_long' },
          content: Buffer.from(input.audio).toString('base64'),
        }),
      });
      if (!response.ok) return { error: `Google Speech request failed (${response.status})` };
      const payload = await response.json() as { results?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
      const text = (payload.results || []).map((item) => item.alternatives?.[0]?.transcript || '').join(' ').trim();
      return text ? { text } : { error: 'no speech detected' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Google Speech request failed' };
    }
  }
}

class UnavailableTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly reason: string) {}

  async transcribe(_input: TranscriptionInput): Promise<{ error: string }> {
    return { error: this.reason };
  }
}

export function createTranscriptionProvider(env: Record<string, string | undefined> = process.env): TranscriptionProvider {
  if (env.VOICE_PROVIDER !== 'google') return new UnavailableTranscriptionProvider('voice transcription is not configured');
  const credentialsPath = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) return new UnavailableTranscriptionProvider('voice provider credentials are unavailable');
  try {
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8')) as GoogleCredentials;
    if (!credentials.client_email || !credentials.private_key) return new UnavailableTranscriptionProvider(`invalid Google credentials file: ${basename(credentialsPath)}`);
    return new GoogleTranscriptionProvider(credentials, {
      project: env.GOOGLE_CLOUD_PROJECT,
      location: env.GOOGLE_SPEECH_LOCATION,
      language: env.GOOGLE_SPEECH_LANGUAGE,
    });
  } catch {
    return new UnavailableTranscriptionProvider('voice provider credentials could not be loaded');
  }
}
