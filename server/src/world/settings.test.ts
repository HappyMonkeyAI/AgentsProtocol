import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsStore, DEFAULT_SETTINGS, SETTINGS_VERSION } from '../../../client/src/settings';

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
}

test('settings store loads defaults and persists changes', () => {
  const persisted = storage();
  const store = createSettingsStore(persisted);
  assert.deepEqual(store.get(), DEFAULT_SETTINGS);
  store.set('voiceIncoming', false);
  const saved = JSON.parse(persisted.getItem('mrpg-realms.settings') || '{}');
  assert.equal(saved.version, SETTINGS_VERSION);
  assert.equal(saved.settings.voiceIncoming, false);
  assert.equal(createSettingsStore(persisted).get().voiceIncoming, false);
  assert.equal(store.get().voiceIncoming, false);
});

test('settings store ignores malformed and unknown persisted values', () => {
  const store = createSettingsStore(storage({ 'mrpg-realms.settings': '{bad json' }));
  assert.equal(store.get().reducedMotion, DEFAULT_SETTINGS.reducedMotion);
  assert.equal(SETTINGS_VERSION, 1);
});
