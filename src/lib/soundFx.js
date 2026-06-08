let audioCtx = null;
let soundEnabled = true;

function getAudioContextConstructor() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function initAudio() {
  if (audioCtx) return;

  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) return;

  try {
    audioCtx = new AudioContextConstructor();
  } catch {
    audioCtx = null;
  }
}

function ensureInteraction() {
  initAudio();

  if (audioCtx?.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('legacy-exe-sound-enabled', String(soundEnabled));
  }
}

export function getSoundEnabled() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('legacy-exe-sound-enabled');
    if (stored !== null) {
      soundEnabled = stored === 'true';
    }
  }

  return soundEnabled;
}

function playTone({ frequency, duration, type = 'sine', volume = 0.1 }) {
  if (!soundEnabled) return;

  ensureInteraction();

  if (!audioCtx) return;

  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // Sound effects should never break the app.
  }
}

export function playClick() {
  playTone({ frequency: 300, duration: 0.08, type: 'sine', volume: 0.08 });
}

export function playQuestComplete() {
  playTone({ frequency: 440, duration: 0.1, type: 'sine', volume: 0.1 });
  setTimeout(() => playTone({ frequency: 660, duration: 0.15, type: 'sine', volume: 0.08 }), 50);
}

export function playLevelUp() {
  playTone({ frequency: 330, duration: 0.12, type: 'sine', volume: 0.1 });
  setTimeout(() => playTone({ frequency: 440, duration: 0.12, type: 'sine', volume: 0.1 }), 80);
  setTimeout(() => playTone({ frequency: 660, duration: 0.18, type: 'sine', volume: 0.12 }), 160);
}

export function playAchievement() {
  playTone({ frequency: 523, duration: 0.08, type: 'sine', volume: 0.1 });
  setTimeout(() => playTone({ frequency: 659, duration: 0.08, type: 'sine', volume: 0.1 }), 80);
  setTimeout(() => playTone({ frequency: 784, duration: 0.12, type: 'sine', volume: 0.12 }), 160);
}

export function playBossDefeat() {
  playTone({ frequency: 220, duration: 0.15, type: 'sine', volume: 0.15 });
  setTimeout(() => playTone({ frequency: 165, duration: 0.15, type: 'sine', volume: 0.12 }), 100);
  setTimeout(() => playTone({ frequency: 330, duration: 0.2, type: 'sine', volume: 0.1 }), 250);
  setTimeout(() => playTone({ frequency: 440, duration: 0.25, type: 'sine', volume: 0.08 }), 450);
}