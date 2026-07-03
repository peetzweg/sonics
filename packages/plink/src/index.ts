/*!
 * plink — tiny, dependency-free UI sounds you can feel.
 *
 * Synthesises pleasant microinteraction sounds at runtime with the Web Audio
 * API. No audio files, no dependencies. Every sound is a plain, serialisable
 * spec object, so you can design one, encode it to a string, share it, and
 * replay it anywhere.
 *
 * The physical model (per "tick"): a short burst of noise strikes a resonant
 * body (a band-pass filter), which rings at `freq` and decays in `decay`
 * seconds. Stack two ticks a few ms apart and you get the "press + release"
 * of a mechanical switch — the thing that makes a click feel tactile.
 *
 * Reverse-engineered from the ElevenLabs onboarding click. See README.
 * License: MIT.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single impulse. All fields optional; sensible defaults are filled in. */
export interface Tick {
  /** Start time in seconds, relative to the sound's start. Default 0. */
  at?: number;
  /** Loudness of this tick, 0..1. Default 0.5. */
  gain?: number;
  /** Resonant frequency in Hz. Default 3120. */
  freq?: number;
  /** Band-pass Q — higher is more tonal/ringing. Default 7. */
  q?: number;
  /** Amplitude decay time constant in seconds. Default 0.0032. */
  decay?: number;
  /** Amount of noise-burst "breath", 0..1. Default 1. */
  noise?: number;
  /** Level of the pure resonant sine tail, 0..1. Default 0.6. */
  tail?: number;
  /** Level of the high attack transient / "tick", 0..1. Default 0.55. */
  bright?: number;
  /** High-partial frequency multiplier (freq * partial). Default 3.3. */
  partial?: number;
}

/** A complete sound: master volume plus one or more ticks. */
export interface Sound {
  /** Master gain for the whole sound. Default 0.9. */
  volume?: number;
  ticks: Tick[];
  /** Optional label, purely for humans. */
  name?: string;
}

export interface PlayOptions {
  /** Per-play volume multiplier. Default 1. */
  volume?: number;
  /** Pitch/speed: scales every freq and 1/time. Default 1. */
  rate?: number;
  /** 0..1 — random pitch/gain jitter so repeats aren't identical. Default 0. */
  humanize?: number;
  /** Delay before playing, in seconds. Default 0. */
  when?: number;
}

export interface RenderOptions {
  sampleRate?: number;
  /** Extra silence appended after the sound, in seconds. Default 0.02. */
  tail?: number;
}

export type SoundInput = Sound | PresetName | (string & {});

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TICK: Required<Tick> = {
  at: 0,
  gain: 0.5,
  freq: 3120,
  q: 7,
  decay: 0.0032,
  noise: 1,
  tail: 0.6,
  bright: 0.55,
  partial: 3.3,
};

const ATTACK = 0.0004; // 0.4 ms — soft enough to avoid a hard digital edge
const FLOOR = 0.0001; // exponential ramps can't reach 0

// ---------------------------------------------------------------------------
// Engine — one shared, lazily-created AudioContext
// ---------------------------------------------------------------------------

type Ctor = typeof AudioContext;
const AC: Ctor | null =
  typeof window !== "undefined"
    ? ((window.AudioContext || (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext) ??
        null)
    : null;

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;
let _noiseBuf: AudioBuffer | null = null;
let _muted = false;
let _volume = 1;
let _armed = false;

/** Is the Web Audio API available in this environment? */
export function isSupported(): boolean {
  return !!AC;
}

/** Get (or lazily create) the shared AudioContext + master gain node. */
export function context(): AudioContext {
  if (!AC) throw new Error("plink: Web Audio API not available");
  if (!_ctx) {
    _ctx = new AC();
    _master = _ctx.createGain();
    _master.gain.value = _volume;
    _master.connect(_ctx.destination);
    _noiseBuf = whiteNoise(_ctx, 0.03);
  }
  return _ctx;
}

/**
 * Browsers suspend audio until a user gesture. Call this from a click/keydown,
 * or call `armAutoUnlock()` once and forget about it. Safe to call often.
 */
export function unlock(): Promise<void> {
  const ctx = context();
  return ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
}

/** Resume audio automatically on the first pointer/key/touch gesture. */
export function armAutoUnlock(): void {
  if (_armed || typeof window === "undefined") return;
  _armed = true;
  const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
  const go = () => {
    void unlock();
    events.forEach((e) => window.removeEventListener(e, go));
  };
  events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
}

export function setMuted(m: boolean): void {
  _muted = !!m;
}
export function isMuted(): boolean {
  return _muted;
}

/** Master volume, 0..1 (or higher). Applied to every sound. */
export function setVolume(v: number): void {
  _volume = Math.max(0, v);
  if (_master) _master.gain.value = _volume;
}
export function getVolume(): number {
  return _volume;
}

function whiteNoise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ---------------------------------------------------------------------------
// Synthesis — the whole physical model lives here
// ---------------------------------------------------------------------------

function scheduleTick(
  ctx: BaseAudioContext,
  dest: AudioNode,
  start: number,
  raw: Tick,
  noiseBuf: AudioBuffer
): void {
  const t = { ...DEFAULT_TICK, ...raw };
  const t0 = start + t.at;

  // 1. impulse → resonant body: noise burst through a band-pass filter.
  if (t.noise > 0) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = t.freq;
    bp.Q.value = t.q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(t.gain * t.noise, t0 + ATTACK);
    g.gain.exponentialRampToValueAtTime(FLOOR, t0 + t.decay);
    src.connect(bp).connect(g).connect(dest);
    src.start(t0);
    src.stop(t0 + t.decay + 0.02);
  }

  // 2. pure resonant tail: a sine at the resonant frequency (the bright
  //    horizontal line you see on the spectrogram).
  if (t.tail > 0) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = t.freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(t.gain * t.tail, t0 + ATTACK);
    g.gain.exponentialRampToValueAtTime(FLOOR, t0 + t.decay * 1.25);
    osc.connect(g).connect(dest);
    osc.start(t0);
    osc.stop(t0 + t.decay * 1.5 + 0.02);
  }

  // 3. high attack transient: the crisp "tick" on top.
  if (t.bright > 0) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = t.freq * t.partial;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(t.gain * 0.3 * t.bright, t0 + ATTACK * 0.75);
    g.gain.exponentialRampToValueAtTime(FLOOR, t0 + 0.004);
    osc.connect(g).connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.02);
  }
}

/** Total scheduled duration of a spec, in seconds (for offline rendering). */
function specDuration(spec: Sound): number {
  let end = 0;
  for (const raw of spec.ticks ?? []) {
    const t = { ...DEFAULT_TICK, ...raw };
    end = Math.max(end, t.at + t.decay * 1.5 + 0.03);
  }
  return end || 0.05;
}

// ---------------------------------------------------------------------------
// Public play API
// ---------------------------------------------------------------------------

/** Play a sound now. `sound` is a spec, a preset name, or an encoded string. */
export function play(sound: SoundInput, opts: PlayOptions = {}): void {
  if (!AC || _muted) return;
  if (typeof document !== "undefined" && document.hidden) return; // don't play in background tabs

  const spec = resolve(sound);
  if (!spec.ticks?.length) return;

  const ctx = context();
  if (ctx.state === "suspended") void ctx.resume();

  const { volume = 1, rate = 1, humanize = 0, when = 0 } = opts;

  const bus = ctx.createGain();
  bus.gain.value = (spec.volume ?? 0.9) * volume;
  bus.connect(_master!);

  const start = ctx.currentTime + Math.max(0, when) + 0.005;
  const jitter = (amt: number) => 1 + (Math.random() * 2 - 1) * amt;

  for (const raw of spec.ticks) {
    const tick: Tick = { ...raw };
    if (rate !== 1) {
      tick.freq = (tick.freq ?? DEFAULT_TICK.freq) * rate;
      tick.at = (tick.at ?? 0) / rate;
      tick.decay = (tick.decay ?? DEFAULT_TICK.decay) / rate;
    }
    if (humanize > 0) {
      tick.freq = (tick.freq ?? DEFAULT_TICK.freq) * jitter(0.03 * humanize);
      tick.gain = (tick.gain ?? DEFAULT_TICK.gain) * jitter(0.12 * humanize);
    }
    scheduleTick(ctx, bus, start, tick, _noiseBuf!);
  }

  const dur = specDuration(spec) / rate;
  setTimeout(
    () => {
      try {
        bus.disconnect();
      } catch {
        /* already gone */
      }
    },
    (dur + 0.1) * 1000
  );
}

/** Returns a bound trigger function for a sound. */
export function sound(soundOrName: SoundInput, opts?: PlayOptions): () => void {
  return () => play(soundOrName, opts);
}

// ---------------------------------------------------------------------------
// Offline render + WAV export (bake a spec into a file if you prefer)
// ---------------------------------------------------------------------------

/** Render a spec to a mono AudioBuffer without playing it. */
export async function render(sound: SoundInput, opts: RenderOptions = {}): Promise<AudioBuffer> {
  const { sampleRate = 44100, tail = 0.02 } = opts;
  const spec = resolve(sound);
  const dur = specDuration(spec) + tail;
  const OAC =
    typeof window !== "undefined"
      ? (window.OfflineAudioContext ||
          (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
            .webkitOfflineAudioContext)
      : null;
  if (!OAC) throw new Error("plink: OfflineAudioContext not available");
  const off = new OAC(1, Math.ceil(sampleRate * dur), sampleRate);
  const nb = whiteNoise(off, 0.03);
  const bus = off.createGain();
  bus.gain.value = spec.volume ?? 0.9;
  bus.connect(off.destination);
  for (const raw of spec.ticks) scheduleTick(off, bus, 0.001, raw, nb);
  return off.startRendering();
}

/** Render a spec and return a 16-bit PCM WAV Blob you can download. */
export async function toWav(sound: SoundInput, opts?: RenderOptions): Promise<Blob> {
  return encodeWav(await render(sound, opts));
}

function encodeWav(buffer: AudioBuffer): Blob {
  const ch = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const n = ch.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(ab);
  const ws = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  dv.setUint32(4, 36 + n * 2, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  ws(36, "data");
  dv.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([ab], { type: "audio/wav" });
}

// ---------------------------------------------------------------------------
// Encode / decode — share a sound as a compact string
// ---------------------------------------------------------------------------

/** Encode a spec to a URL-safe string you can save, share, or put in a link. */
export function encode(spec: Sound): string {
  const json = JSON.stringify(spec);
  // btoa handles Latin-1; the escape dance makes it UTF-8 safe.
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a string produced by `encode` back into a spec. */
export function decode(str: string): Sound {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json) as Sound;
}

// ---------------------------------------------------------------------------
// Presets — tasteful defaults. All are plain specs; copy and tweak freely.
// ---------------------------------------------------------------------------

export const presets = {
  /** The ElevenLabs-style double click: two ticks, the release slightly louder. */
  click: {
    volume: 0.9,
    ticks: [
      { at: 0, gain: 0.5, freq: 3120, q: 7, decay: 0.0032 },
      { at: 0.0276, gain: 0.66, freq: 3120, q: 7, decay: 0.0032 },
    ],
  },
  /** A single soft tap — lighter than a full click. */
  tap: {
    volume: 0.8,
    ticks: [{ at: 0, gain: 0.55, freq: 2600, q: 6, decay: 0.004, bright: 0.4 }],
  },
  /** Tiny, dry — good for list/keyboard ticks. */
  tick: {
    volume: 0.7,
    ticks: [{ at: 0, gain: 0.4, freq: 4200, q: 9, decay: 0.0018, tail: 0.3, bright: 0.7 }],
  },
  /** Rounder, lower — a "pop". */
  pop: {
    volume: 0.9,
    ticks: [{ at: 0, gain: 0.6, freq: 1400, q: 5, decay: 0.006, bright: 0.25, tail: 0.8 }],
  },
  /** Two ticks rising in pitch = "on". */
  toggleOn: {
    volume: 0.85,
    ticks: [
      { at: 0, gain: 0.45, freq: 2600, q: 7, decay: 0.003 },
      { at: 0.03, gain: 0.6, freq: 3500, q: 7, decay: 0.0035 },
    ],
  },
  /** Two ticks falling in pitch = "off". */
  toggleOff: {
    volume: 0.85,
    ticks: [
      { at: 0, gain: 0.55, freq: 3200, q: 7, decay: 0.003 },
      { at: 0.03, gain: 0.45, freq: 2300, q: 7, decay: 0.0035 },
    ],
  },
  /** Gentle two-note rise for confirmations. */
  success: {
    volume: 0.85,
    ticks: [
      { at: 0, gain: 0.5, freq: 2637, q: 8, decay: 0.006, tail: 0.9, noise: 0.3 },
      { at: 0.09, gain: 0.55, freq: 3520, q: 8, decay: 0.008, tail: 0.9, noise: 0.3 },
    ],
  },
  /** Two low, close ticks for errors — dull, not harsh. */
  error: {
    volume: 0.85,
    ticks: [
      { at: 0, gain: 0.55, freq: 320, q: 4, decay: 0.02, tail: 0.9, noise: 0.2, bright: 0.05 },
      { at: 0.12, gain: 0.55, freq: 300, q: 4, decay: 0.02, tail: 0.9, noise: 0.2, bright: 0.05 },
    ],
  },
} satisfies Record<string, Sound>;

export type PresetName = keyof typeof presets;

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function resolve(sound: SoundInput): Sound {
  if (typeof sound === "string") {
    if (sound in presets) return presets[sound as PresetName];
    try {
      return decode(sound);
    } catch {
      throw new Error(`plink: unknown preset or bad encoded string "${sound}"`);
    }
  }
  return sound;
}

// ---------------------------------------------------------------------------
// Default export: everything, plus callable shorthand `plink("click")`.
// ---------------------------------------------------------------------------

export interface Plink {
  (sound: SoundInput, opts?: PlayOptions): void;
  play: typeof play;
  sound: typeof sound;
  presets: typeof presets;
  render: typeof render;
  toWav: typeof toWav;
  encode: typeof encode;
  decode: typeof decode;
  context: typeof context;
  unlock: typeof unlock;
  armAutoUnlock: typeof armAutoUnlock;
  isSupported: typeof isSupported;
  setMuted: typeof setMuted;
  isMuted: typeof isMuted;
  setVolume: typeof setVolume;
  getVolume: typeof getVolume;
  DEFAULT_TICK: typeof DEFAULT_TICK;
}

const plink: Plink = Object.assign((s: SoundInput, o?: PlayOptions) => play(s, o), {
  play,
  sound,
  presets,
  render,
  toWav,
  encode,
  decode,
  context,
  unlock,
  armAutoUnlock,
  isSupported,
  setMuted,
  isMuted,
  setVolume,
  getVolume,
  DEFAULT_TICK,
});

export default plink;
