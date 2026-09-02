import type { ChatMessage, PlayerRole, VoiceTranscriptionResult } from '../../shared/protocol';
import type { Settings } from './settings';

interface ChatSocket {
  emit(event: string, ...args: unknown[]): void;
  on(event: 'chat:message' | 'chat:system', handler: (payload: ChatMessage) => void): void;
  on(event: 'voice:result', handler: (payload: VoiceTranscriptionResult) => void): void;
}

interface ChatOptions {
  onLocalCommand: (raw: string) => boolean;
  getSettings: () => Settings;
  onVoiceFallbackRequested: () => void;
}

export function createChatController(options: ChatOptions) {
  const chatEl = document.getElementById('chat')!;
  const historyEl = document.getElementById('chat-history')!;
  const input = document.getElementById('chat-input') as HTMLInputElement;
  const statusEl = document.getElementById('chat-status')!;
  const voiceStatusEl = document.getElementById('voice-status')!;
  const reviewEl = document.getElementById('voice-review') as HTMLElement;
  const transcriptEl = document.getElementById('voice-transcript') as HTMLTextAreaElement;
  const sendTranscriptBtn = document.getElementById('voice-send') as HTMLButtonElement;
  const cancelTranscriptBtn = document.getElementById('voice-cancel') as HTMLButtonElement;
  let socket: ChatSocket | null = null;
  let self: { id: string; name: string; role: PlayerRole } | null = null;
  let open = false;

  function addMessage(message: ChatMessage, system = false) {
    const row = document.createElement('div');
    row.className = system ? 'chat-line chat-system' : 'chat-line';
    const sender = system ? 'Realm' : message.senderName;
    const timestamp = options.getSettings().chatTimestamps
      ? ` [${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`
      : '';
    row.textContent = `${sender}${timestamp}: ${message.text}`;
    historyEl.appendChild(row);
    while (historyEl.children.length > options.getSettings().chatHistoryLength) historyEl.firstElementChild?.remove();
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  function addSystem(text: string) {
    addMessage({ id: `local-${Date.now()}`, senderId: 'system', senderName: 'Realm', senderRole: 'builder', text, createdAt: Date.now() }, true);
  }

  function speakIncomingVoice(message: ChatMessage) {
    const settings = options.getSettings();
    if (!message.voice || message.senderId === self?.id || !settings.voiceIncoming || !settings.browserTts) return;
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined' || message.text.startsWith('/')) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${message.senderName} says: ${message.text}`);
    utterance.volume = settings.voiceVolume;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  function setOpen(next: boolean) {
    open = next;
    chatEl.hidden = !next;
    if (next) {
      document.exitPointerLock();
      input.focus();
    }
  }

  function submit() {
    const text = input.value.trim();
    if (!text) return;
    if (text.startsWith('/') && options.onLocalCommand(text)) {
      input.value = '';
      return;
    }
    if (!socket || !self) {
      addSystem('Not connected to a realm.');
      return;
    }
    socket.emit('chat:send', { text });
    input.value = '';
  }

  function sendReviewedTranscript() {
    const text = transcriptEl.value.trim();
    if (!text) return;
    if (text.startsWith('/')) {
      addSystem('Voice commands are not executed automatically. Type the command manually if intended.');
    } else if (socket && self) {
      socket.emit('chat:send', { text });
    } else {
      addSystem('Not connected to a realm.');
    }
    reviewEl.hidden = true;
    transcriptEl.value = '';
  }

  function showTranscript(transcript: string, source: 'server' | 'browser') {
    setOpen(true);
    if (transcript.startsWith('/')) {
      addSystem('Voice commands are not executed automatically. Type the command manually if intended.');
      voiceStatusEl.textContent = 'Voice command blocked; type it manually if intended.';
      return;
    }
    if (!socket || !self) {
      addSystem('Not connected to a realm.');
      return;
    }
    socket.emit('voice:send-transcript', { text: transcript });
    voiceStatusEl.textContent = source === 'browser'
      ? 'Browser voice message sent.'
      : 'Voice message sent.';
  }

  input.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Enter') submit();
    if (event.key === 'Escape') setOpen(false);
  });
  chatEl.addEventListener('click', (event) => event.stopPropagation());
  sendTranscriptBtn.addEventListener('click', sendReviewedTranscript);
  cancelTranscriptBtn.addEventListener('click', () => { reviewEl.hidden = true; transcriptEl.value = ''; });
  window.addEventListener('keydown', (event) => {
    if (!self || event.repeat) return;
    if (event.key === 'Enter' && !open) {
      event.preventDefault();
      setOpen(true);
    }
  });

  return {
    setSocket(next: ChatSocket) {
      socket = next;
      socket.on('chat:message', (message) => {
        addMessage(message);
        speakIncomingVoice(message);
      });
      socket.on('chat:system', (message) => addMessage(message, true));
      socket.on('voice:result', (result) => {
        if (result.status === 'transcript') {
          showTranscript(result.transcript, 'server');
        } else {
          voiceStatusEl.textContent = `Voice unavailable: ${result.reason}`;
          options.onVoiceFallbackRequested();
        }
      });
    },
    setSelf(next: { id: string; name: string; role: PlayerRole }) {
      self = next;
      statusEl.textContent = 'Enter chat · /help for commands';
    },
    addSystem,
    isOpen: () => open,
    setVoiceStatus(text: string) { voiceStatusEl.textContent = text; },
    showTranscript,
    close() { setOpen(false); },
  };
}