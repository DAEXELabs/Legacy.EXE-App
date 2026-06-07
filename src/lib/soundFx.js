let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function ensureInteraction() {
  if (!audioCtx) {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  localStorage.setItem('legacy-exe-sound-enabled', String(enabled));
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
}

export function playClick() {
  playTone({ frequency: 300, duration: 0.08, type: 'sine', volume: 0.08 });
}

export function playQuestComplete() {
  if (!soundEnabled) return;
  ensureInteraction();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  playTone({ frequency: 440, duration: 0.1, type: 'sine', volume: 0.1 });
  setTimeout(() => playTone({ frequency: 660, duration: 0.15, type: 'sine', volume: 0.08 }), 50);
}

export function playLevelUp() {
  if (!soundEnabled) return;
  ensureInteraction();
  if (!audioCtx) return;

  playTone({ frequency: 330, duration: 0.12, type: 'sine', volume: 0.1 });
  setTimeout(() => playTone({ frequency: 440, duration: 0.12, type: 'sine', volume: 0.1 }), 80);
  setTimeout(() => playTone({ frequency: 660, duration: 0.18, type: 'sine', volume: 0.12 }), 160);
}

export function playAchievement() {
  if (!soundEnabled) return;
  ensureInteraction();
  if (!audioCtx) return;

  playTone({ frequency: 523, duration: 0.08, type: 'sine', volume: 0.1 });
  setTimeout(() => playTone({ frequency: 659, duration: 0.08, type: 'sine', volume: 0.1 }), 80);
  setTimeout(() => playTone({ frequency: 784, duration: 0.12, type: 'sine', volume: 0.12 }), 160);
}

export function playBossDefeat() {
  if (!soundEnabled) return;
  ensureInteraction();
  if (!audioCtx) return;

  playTone({ frequency: 220, duration: 0.15, type: 'sine', volume: 0.15 });
  setTimeout(() => playTone({ frequency: 165, duration: 0.15, type: 'sine', volume: 0.12 }), 100);
  setTimeout(() => playTone({ frequency: 330, duration: 0.2, type: 'sine', volume: 0.1 }), 250);
  setTimeout(() => playTone({ frequency: 440, duration: 0.25, type: 'sine', volume: 0.08 }), 450);
}