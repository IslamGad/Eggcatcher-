// Four short, synthesized sound effects — no audio files, no music. Each is
// built from a couple of oscillator tones with a quick attack/decay
// envelope, which keeps every sound comfortably under a second and gives
// exact control over how quiet they are, rather than depending on how loud
// a sourced clip happened to be recorded.
//
// "Not overlapped": there's exactly one active sound at a time. Starting a
// new one stops whatever's still sounding first, so a burst of catches (or
// an angry phase starting while an egg lands) never layers into a mess —
// the most recent event always wins cleanly.

const MASTER_VOLUME = 0.35;

let audioContext: AudioContext | null = null;
let stopCurrentSound: (() => void) | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = new AudioContextCtor();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

/**
 * Creates (or resumes) the audio context. Call this from inside a real user
 * gesture handler (a button's onClick) — browsers only allow audio to start
 * playing if it traces back to one, and our actual sound triggers happen
 * later, inside the game loop, well outside any click handler.
 */
export function primeAudio(): void {
  getContext();
}

interface ToneStep {
  freq: number;
  duration: number;
  type?: OscillatorType;
  /** Peak gain for this step, 0-1, scaled by MASTER_VOLUME. */
  gain?: number;
}

function playTones(steps: ToneStep[]): void {
  const ctx = getContext();
  if (!ctx) return;

  stopCurrentSound?.();

  const master = ctx.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(ctx.destination);

  const oscillators: OscillatorNode[] = [];
  let t = ctx.currentTime;

  for (const step of steps) {
    const osc = ctx.createOscillator();
    osc.type = step.type ?? 'sine';
    osc.frequency.setValueAtTime(step.freq, t);

    const gain = ctx.createGain();
    const peak = step.gain ?? 1;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + step.duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + step.duration + 0.02);
    oscillators.push(osc);

    t += step.duration;
  }

  stopCurrentSound = () => {
    for (const osc of oscillators) {
      try {
        osc.stop();
      } catch {
        // Already stopped — fine, that's what we wanted anyway.
      }
    }
  };
}

/** A quick, satisfying rising "pop" — an egg landing safely in the basket. */
export function playCatchSound(): void {
  playTones([
    { freq: 660, duration: 0.08, type: 'sine', gain: 0.85 },
    { freq: 880, duration: 0.09, type: 'sine', gain: 0.6 },
  ]);
}

/** A soft descending "womp" — an egg hitting the ground, not an alarm. */
export function playMissSound(): void {
  playTones([
    { freq: 260, duration: 0.1, type: 'triangle', gain: 0.75 },
    { freq: 140, duration: 0.15, type: 'triangle', gain: 0.45 },
  ]);
}

/** A short buzzy cluck — distinct and a little sharp, but still quiet. */
export function playAngrySound(): void {
  playTones([
    { freq: 220, duration: 0.07, type: 'square', gain: 0.3 },
    { freq: 180, duration: 0.07, type: 'square', gain: 0.28 },
    { freq: 240, duration: 0.1, type: 'square', gain: 0.26 },
  ]);
}

/** A bright three-note chime arpeggio — a golden egg appearing. */
export function playGoldenDropSound(): void {
  playTones([
    { freq: 784, duration: 0.07, type: 'sine', gain: 0.55 },
    { freq: 988, duration: 0.07, type: 'sine', gain: 0.55 },
    { freq: 1319, duration: 0.13, type: 'sine', gain: 0.5 },
  ]);
}
