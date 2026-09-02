import type { Settings, createSettingsStore } from './settings';

type SettingsStore = ReturnType<typeof createSettingsStore>;

const FIELD_KEYS = {
  'setting-voice-incoming': 'voiceIncoming',
  'setting-voice-transcription': 'voiceTranscription',
  'setting-browser-tts': 'browserTts',
  'setting-chat-timestamps': 'chatTimestamps',
  'setting-chat-history': 'chatHistoryLength',
  'setting-voice-volume': 'voiceVolume',
  'setting-reduced-motion': 'reducedMotion',
  'setting-ai-confirmation': 'aiConfirmation',
} as const;

export function createSettingsUi(store: SettingsStore) {
  const button = document.getElementById('settings-button') as HTMLButtonElement;
  const modal = document.getElementById('settings-modal') as HTMLElement;
  const closeButton = document.getElementById('settings-close') as HTMLButtonElement;
  const fields = new Map<string, HTMLInputElement>();
  Object.keys(FIELD_KEYS).forEach((id) => fields.set(id, document.getElementById(id) as HTMLInputElement));
  let lastFocused: HTMLElement | null = null;

  function apply(settings: Settings) {
    for (const [id, key] of Object.entries(FIELD_KEYS)) {
      const field = fields.get(id)!;
      const value = settings[key];
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else field.value = String(value);
    }
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false';
  }

  function focusable() {
    return [...modal.querySelectorAll<HTMLElement>('button, input')].filter((element) => !element.hidden && !element.closest('[hidden]'));
  }

  function setOpen(open: boolean) {
    modal.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) {
      lastFocused = document.activeElement as HTMLElement;
      closeButton.focus();
    } else {
      lastFocused?.focus();
      lastFocused = null;
    }
  }

  function selectTab(tab: string) {
    document.querySelectorAll<HTMLButtonElement>('[data-settings-tab]').forEach((tabButton) => {
      const selected = tabButton.dataset.settingsTab === tab;
      tabButton.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll<HTMLElement>('[data-settings-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.settingsPanel !== tab;
    });
  }

  apply(store.get());
  store.subscribe(apply);
  button.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));
  modal.addEventListener('click', (event) => event.stopPropagation());
  document.querySelectorAll<HTMLButtonElement>('[data-settings-tab]').forEach((tabButton) => {
    tabButton.addEventListener('click', () => selectTab(tabButton.dataset.settingsTab || 'general'));
  });
  fields.forEach((field, id) => {
    const key = FIELD_KEYS[id as keyof typeof FIELD_KEYS];
    const update = () => {
      const value: Settings[typeof key] = field.type === 'checkbox'
        ? field.checked as Settings[typeof key]
        : Number(field.value) as Settings[typeof key];
      store.set(key, value);
    };
    field.addEventListener(field.type === 'range' ? 'input' : 'change', update);
  });
  window.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const targets = focusable();
    const first = targets[0];
    const last = targets[targets.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return { setOpen, isOpen: () => !modal.hidden };
}
