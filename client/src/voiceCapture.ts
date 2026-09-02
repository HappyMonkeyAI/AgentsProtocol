export interface VoiceClip {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

interface VoiceCaptureOptions {
  isActive: () => boolean;
  isEnabled: () => boolean;
  onClip: (clip: VoiceClip) => void;
  onStatus: (text: string) => void;
  onFallbackTranscript: (transcript: string) => void;
}

interface BrowserRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const MAX_DURATION_MS = 10_000;

export function createVoiceCapture(options: VoiceCaptureOptions) {
  const button = document.getElementById('voice-hold') as HTMLButtonElement;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let startedAt = 0;
  let stopTimer: number | undefined;
  let chunks: Blob[] = [];
  let recognition: BrowserRecognition | null = null;
  let fallbackRequested = false;
  let pendingBrowserTranscript = '';
  let captureId = 0;

  function recognitionConstructor(): (new () => BrowserRecognition) | undefined {
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => BrowserRecognition;
      webkitSpeechRecognition?: new () => BrowserRecognition;
    };
    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
  }

  function startBrowserRecognition() {
    const Constructor = recognitionConstructor();
    if (!Constructor) return;
    try {
      recognition = new Constructor();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || '';
        if (!transcript) return;
        pendingBrowserTranscript = transcript;
        if (fallbackRequested) {
          fallbackRequested = false;
          options.onFallbackTranscript(transcript);
        }
      };
      recognition.onerror = () => {
        recognition = null;
        if (fallbackRequested) {
          fallbackRequested = false;
          options.onStatus('Browser voice recognition could not start. Typed chat still works.');
        }
      };
      recognition.start();
    } catch {
      recognition = null;
    }
  }

  function stopBrowserRecognition() {
    try { recognition?.stop(); } catch { /* browser may already have ended */ }
    recognition = null;
  }

  function supported() {
    return Boolean(typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined');
  }

  function finish() {
    captureId += 1;
    stopBrowserRecognition();
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    if (stopTimer !== undefined) window.clearTimeout(stopTimer);
    stopTimer = undefined;
  }

  async function start(source: 'button' | 'keyboard' = 'button') {
    if (recorder || (source === 'button' ? !options.isActive() : options.isActive())) return;
    if (!options.isEnabled()) {
      options.onStatus('Voice transcription is disabled in Settings.');
      return;
    }
    if (!supported()) {
      options.onStatus('Voice capture is not supported by this browser.');
      return;
    }
    const currentCaptureId = ++captureId;
    try {
      pendingBrowserTranscript = '';
      startBrowserRecognition();
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (currentCaptureId !== captureId) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = nextStream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks = [];
      startedAt = Date.now();
      recorder.addEventListener('dataavailable', (event) => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener('stop', () => {
        const durationMs = Math.min(MAX_DURATION_MS, Date.now() - startedAt);
        const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' });
        const activeStream = stream;
        recorder = null;
        stream = null;
        chunks = [];
        activeStream?.getTracks().forEach((track) => track.stop());
        button.dataset.listening = 'false';
        if (blob.size) options.onClip({ blob, mimeType: blob.type, durationMs });
        options.onStatus('Voice clip ready for transcription.');
      }, { once: true });
      recorder.start();
      button.dataset.listening = 'true';
      options.onStatus('Listening… release to transcribe.');
      stopTimer = window.setTimeout(finish, MAX_DURATION_MS);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      stopBrowserRecognition();
      recorder = null;
      stream = null;
      options.onStatus('Microphone permission was denied or unavailable. Typed chat still works.');
    }
  }

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    void start('button');
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => button.addEventListener(eventName, finish));
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyT' && !event.repeat) void start('keyboard');
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'KeyT') finish();
  });

  function requestBrowserFallback() {
    if (!recognitionConstructor()) {
      options.onStatus('Server transcription is unavailable and this browser has no speech recognition.');
      return;
    }
    fallbackRequested = true;
    if (pendingBrowserTranscript) {
      fallbackRequested = false;
      const transcript = pendingBrowserTranscript;
      options.onFallbackTranscript(transcript);
    } else {
      startBrowserRecognition();
      options.onStatus('Server transcription is unavailable. Say that again for browser recognition…');
    }
  }

  return { start, stop: finish, supported, requestBrowserFallback };
}
