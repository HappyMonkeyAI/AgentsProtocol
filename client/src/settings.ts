export const SETTINGS_VERSION = 1;
const STORAGE_KEY = 'mrpg-realms.settings';

export interface Settings {
  voiceIncoming: boolean;
  voiceTranscription: boolean;
  voiceVolume: number;
  browserTts: boolean;
  chatTimestamps: boolean;
  chatHistoryLength: number;
  reducedMotion: boolean;
  aiConfirmation: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  voiceIncoming: true,
  voiceTranscription: true,
  voiceVolume: 0.8,
  browserTts: true,
  chatTimestamps: false,
  chatHistoryLength: 80,
  reducedMotion: false,
  aiConfirmation: true,
};

export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): SettingsStorage | undefined {
  return (globalThis as typeof globalThis & { localStorage?: SettingsStorage }).localStorage;
}

function sanitize(value: unknown): Partial<Settings> {
  if (!value || typeof value !== 'object') return {};
  const raw = value as Record<string, unknown>;
  const result: Partial<Settings> = {};
  if (typeof raw.voiceIncoming === 'boolean') result.voiceIncoming = raw.voiceIncoming;
  if (typeof raw.voiceTranscription === 'boolean') result.voiceTranscription = raw.voiceTranscription;
  if (typeof raw.voiceVolume === 'number' && Number.isFinite(raw.voiceVolume)) result.voiceVolume = Math.max(0, Math.min(1, raw.voiceVolume));
  if (typeof raw.browserTts === 'boolean') result.browserTts = raw.browserTts;
  if (typeof raw.chatTimestamps === 'boolean') result.chatTimestamps = raw.chatTimestamps;
  if (typeof raw.chatHistoryLength === 'number' && Number.isInteger(raw.chatHistoryLength)) result.chatHistoryLength = Math.max(20, Math.min(200, raw.chatHistoryLength));
  if (typeof raw.reducedMotion === 'boolean') result.reducedMotion = raw.reducedMotion;
  if (typeof raw.aiConfirmation === 'boolean') result.aiConfirmation = raw.aiConfirmation;
  return result;
}

export function loadSettings(storage = browserStorage()): Settings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}') as { version?: unknown; settings?: unknown };
    return { ...DEFAULT_SETTINGS, ...sanitize(parsed.settings ?? parsed) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function createSettingsStore(storage = browserStorage()) {
  let current = loadSettings(storage);
  const listeners = new Set<(settings: Settings) => void>();

  function persist() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ version: SETTINGS_VERSION, settings: current }));
    } catch {
      // Private browsing and blocked storage should not disable gameplay.
    }
  }

  return {
    get: () => ({ ...current }),
    set<K extends keyof Settings>(key: K, value: Settings[K]) {
      const next = sanitize({ [key]: value })[key];
      if (next === undefined) return;
      current = { ...current, [key]: next };
      persist();
      listeners.forEach((listener) => listener({ ...current }));
    },
    subscribe(listener: (settings: Settings) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
