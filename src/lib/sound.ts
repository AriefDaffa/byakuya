'use client';

/**
 * Lightweight 8-bit chiptune sound synthesizer using the Web Audio API.
 * No external audio files are required.
 */

const SOUND_MUTE_STORAGE_KEY = 'byakuya_sound_muted';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(SOUND_MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_MUTE_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage errors in restricted environments
  }
}

function playTone(
  frequency: number,
  durationSec: number,
  type: OscillatorType = 'square',
  gainPeak = 0.04,
  delaySec = 0,
): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.01);
  } catch {
    // Ignore audio playback errors (e.g., before user gesture)
  }
}

export function playSendSfx(): void {
  playTone(523.25, 0.06, 'square', 0.035, 0);
  playTone(783.99, 0.08, 'square', 0.035, 0.05);
}

export function playReceiveSfx(): void {
  playTone(659.25, 0.07, 'square', 0.04, 0);
  playTone(880, 0.1, 'square', 0.04, 0.06);
}

export function playReactionSfx(): void {
  playTone(987.77, 0.05, 'triangle', 0.045, 0);
  playTone(1318.51, 0.07, 'triangle', 0.04, 0.04);
}
