/*!
 * sonics/presets — the cuelume palette, ported to sonics specs.
 *
 * Seventeen interaction sounds designed by Daniel Belyi for cuelume
 * (https://github.com/Danilaa1/cuelume), reproduced here as plain sonics
 * `Sound` specs so they can be played, tweaked in the playground, shared as
 * encoded strings, and baked to WAV like any other sonics sound.
 *
 * The sounds themselves are:
 *   MIT License · Copyright (c) 2026 Daniel Belyi
 *   https://github.com/Danilaa1/cuelume/blob/main/LICENSE
 *
 * The port is mechanical. cuelume builds a sound from layers — a `ToneLayer`
 * (an oscillator with an attack/decay envelope and an optional pitch glide) or
 * a `NoiseLayer` (filtered noise with the same envelope). Each layer becomes
 * one sonics tick:
 *
 *   tone  → { noise: 0, tail: 1, bright: 0, ring: 1, wave, glideTo }
 *   noise → { noise: 1, tail: 0, bright: 0, filter, q }
 *
 * Every tick carries `curve: "exp"` because cuelume ramps all of its envelopes
 * exponentially, where sonics' own presets rise linearly.
 *
 * Two numeric conversions, applied throughout:
 *   - `gain` is cuelume's layer `peak` × 4, folding in the ×4 output stage
 *     cuelume runs before its limiter, so levels match by ear.
 *   - `decay` is measured from the tick's start, where cuelume measures it
 *     from the end of the attack — so `decay = attack + cuelume.decay`.
 *
 * `bloom`'s two voices are detuned 12 cents apart in cuelume; sonics has no
 * detune field, so the second voice carries the cents folded into its `freq`.
 */

import type { Sound } from "../index";

/** The seventeen cuelume sounds as sonics specs. Copy and tweak freely. */
export const cuelume = {
  /** Soft two-note ascending bell. Default hover. */
  chime: {
    name: "chime",
    volume: 0.5,
    ticks: [
      {
        at: 0,
        gain: 0.36,
        freq: 1046.5,
        attack: 0.006,
        curve: "exp",
        decay: 0.226,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.09,
        gain: 0.32,
        freq: 1568,
        attack: 0.006,
        curve: "exp",
        decay: 0.266,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
  },

  /** Quick four-note twinkle. Playful accents. */
  sparkle: {
    name: "sparkle",
    volume: 0.5,
    ticks: [
      {
        at: 0,
        gain: 0.18,
        freq: 1760,
        attack: 0.003,
        curve: "exp",
        decay: 0.093,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.045,
        gain: 0.16,
        freq: 2217,
        attack: 0.003,
        curve: "exp",
        decay: 0.093,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.09,
        gain: 0.152,
        freq: 2637,
        attack: 0.003,
        curve: "exp",
        decay: 0.103,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.135,
        gain: 0.128,
        freq: 3520,
        attack: 0.003,
        curve: "exp",
        decay: 0.123,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 },
  },

  /** Single note gliding down. Dismiss, collapse. */
  droplet: {
    name: "droplet",
    volume: 0.55,
    ticks: [
      {
        at: 0,
        gain: 0.3,
        freq: 1200,
        glideTo: 550,
        glideTime: 0.14,
        attack: 0.004,
        curve: "exp",
        decay: 0.204,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3000 },
  },

  /** Warm slow swell. Reveal, expand. */
  bloom: {
    name: "bloom",
    volume: 0.5,
    ticks: [
      {
        at: 0,
        gain: 0.24,
        freq: 528,
        attack: 0.06,
        curve: "exp",
        decay: 0.38,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      // 528 Hz detuned +12 cents — the beating between the two is the warmth.
      {
        at: 0,
        gain: 0.2,
        freq: 531.67,
        attack: 0.06,
        curve: "exp",
        decay: 0.4,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 },
  },

  /** Soft hush with a falling tone. Tooltips and quiet previews. */
  whisper: {
    name: "whisper",
    volume: 0.48,
    ticks: [
      {
        at: 0,
        gain: 0.16,
        freq: 1600,
        q: 0.7,
        filter: "lowpass",
        attack: 0.025,
        curve: "exp",
        decay: 0.155,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.01,
        gain: 0.1,
        freq: 880,
        glideTo: 660,
        glideTime: 0.14,
        attack: 0.012,
        curve: "exp",
        decay: 0.152,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
  },

  /** Crisp instant tick. Nav and menu hover. */
  tick: {
    name: "tick",
    volume: 0.4,
    ticks: [
      {
        at: 0,
        gain: 0.56,
        freq: 5400,
        q: 1.8,
        attack: 0.001,
        curve: "exp",
        decay: 0.019,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0,
        gain: 0.072,
        freq: 2600,
        attack: 0.001,
        curve: "exp",
        decay: 0.013,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
  },

  /** Dull muted knock. Pointer down. */
  press: {
    name: "press",
    volume: 0.4,
    ticks: [
      {
        at: 0,
        gain: 0.52,
        freq: 1700,
        q: 1.4,
        attack: 0.001,
        curve: "exp",
        decay: 0.021,
        noise: 1,
        tail: 0,
        bright: 0,
      },
    ],
  },

  /** Brighter springy tick. Pointer up. */
  release: {
    name: "release",
    volume: 0.4,
    ticks: [
      {
        at: 0,
        gain: 0.48,
        freq: 4600,
        q: 1.8,
        attack: 0.001,
        curve: "exp",
        decay: 0.017,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.006,
        gain: 0.08,
        freq: 3200,
        attack: 0.001,
        curve: "exp",
        decay: 0.051,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
  },

  /** Mechanical click-clack. Switches, tabs. */
  toggle: {
    name: "toggle",
    volume: 0.4,
    ticks: [
      {
        at: 0,
        gain: 0.48,
        freq: 2200,
        q: 1.6,
        attack: 0.001,
        curve: "exp",
        decay: 0.017,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.024,
        gain: 0.4,
        freq: 3800,
        q: 1.6,
        attack: 0.001,
        curve: "exp",
        decay: 0.021,
        noise: 1,
        tail: 0,
        bright: 0,
      },
    ],
  },

  /** Warm three-note confirmation. After an action succeeds. */
  success: {
    name: "success",
    volume: 0.5,
    ticks: [
      {
        at: 0,
        gain: 0.24,
        freq: 880,
        attack: 0.004,
        curve: "exp",
        decay: 0.094,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.06,
        gain: 0.24,
        freq: 1108.73,
        attack: 0.004,
        curve: "exp",
        decay: 0.104,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.12,
        gain: 0.28,
        freq: 1318.51,
        attack: 0.004,
        curve: "exp",
        decay: 0.184,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.1, feedback: 0.22, wet: 0.16, lowpass: 4500 },
  },

  /** Soft knock and descending refusal. Recoverable errors. */
  error: {
    name: "error",
    volume: 0.42,
    ticks: [
      {
        at: 0,
        gain: 0.52,
        freq: 850,
        q: 1.1,
        attack: 0.001,
        curve: "exp",
        decay: 0.036,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.025,
        gain: 0.18,
        freq: 440,
        wave: "triangle",
        attack: 0.004,
        curve: "exp",
        decay: 0.094,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.1,
        gain: 0.16,
        freq: 349.23,
        wave: "triangle",
        attack: 0.004,
        curve: "exp",
        decay: 0.144,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
  },

  /** Papery flick with a glass tick. Pages, galleries, carousels. */
  page: {
    name: "page",
    volume: 0.38,
    ticks: [
      {
        at: 0,
        gain: 0.44,
        freq: 1800,
        q: 0.7,
        filter: "lowpass",
        attack: 0.006,
        curve: "exp",
        decay: 0.086,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.04,
        gain: 0.32,
        freq: 4200,
        q: 1.2,
        attack: 0.004,
        curve: "exp",
        decay: 0.069,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.075,
        gain: 0.08,
        freq: 2400,
        attack: 0.002,
        curve: "exp",
        decay: 0.047,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
  },

  /** Brief unresolved rising shimmer. User-initiated work starting. */
  loading: {
    name: "loading",
    volume: 0.42,
    ticks: [
      {
        at: 0,
        gain: 0.14,
        freq: 1400,
        q: 0.6,
        filter: "lowpass",
        attack: 0.035,
        curve: "exp",
        decay: 0.175,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0,
        gain: 0.2,
        freq: 420,
        glideTo: 630,
        glideTime: 0.18,
        attack: 0.025,
        curve: "exp",
        decay: 0.205,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.11, feedback: 0.18, wet: 0.12, lowpass: 2800 },
  },

  /** Rising lock-on with a clear resolve. Content or system ready. */
  ready: {
    name: "ready",
    volume: 0.48,
    ticks: [
      {
        at: 0,
        gain: 0.44,
        freq: 3600,
        q: 1.8,
        attack: 0.001,
        curve: "exp",
        decay: 0.021,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0.012,
        gain: 0.22,
        freq: 330,
        glideTo: 660,
        glideTime: 0.12,
        wave: "triangle",
        attack: 0.004,
        curve: "exp",
        decay: 0.164,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.13,
        gain: 0.24,
        freq: 990,
        attack: 0.004,
        curve: "exp",
        decay: 0.224,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.1, feedback: 0.16, wet: 0.1, lowpass: 4200 },
  },

  /** Compact synthetic chirp. Primary buttons and controls. */
  pulse: {
    name: "pulse",
    volume: 0.42,
    ticks: [
      {
        at: 0,
        gain: 0.32,
        freq: 2600,
        q: 2.4,
        attack: 0.001,
        curve: "exp",
        decay: 0.023,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0,
        gain: 0.22,
        freq: 620,
        glideTo: 1240,
        glideTime: 0.07,
        wave: "triangle",
        attack: 0.002,
        curve: "exp",
        decay: 0.087,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
  },

  /** Fast three-step locator signal. Menus and secondary buttons. */
  scan: {
    name: "scan",
    volume: 0.4,
    ticks: [
      {
        at: 0,
        gain: 0.2,
        freq: 740,
        attack: 0.002,
        curve: "exp",
        decay: 0.057,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.045,
        gain: 0.18,
        freq: 1110,
        attack: 0.002,
        curve: "exp",
        decay: 0.057,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.09,
        gain: 0.16,
        freq: 1665,
        attack: 0.002,
        curve: "exp",
        decay: 0.072,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 },
  },

  /** Rising harmonic portal. Client-side page arrivals. */
  arrival: {
    name: "arrival",
    volume: 0.44,
    ticks: [
      {
        at: 0,
        gain: 0.14,
        freq: 900,
        q: 0.8,
        filter: "lowpass",
        attack: 0.05,
        curve: "exp",
        decay: 0.29,
        noise: 1,
        tail: 0,
        bright: 0,
      },
      {
        at: 0,
        gain: 0.22,
        freq: 220,
        glideTo: 440,
        glideTime: 0.32,
        attack: 0.04,
        curve: "exp",
        decay: 0.38,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.12,
        gain: 0.16,
        freq: 659.25,
        attack: 0.045,
        curve: "exp",
        decay: 0.365,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
      {
        at: 0.19,
        gain: 0.128,
        freq: 987.77,
        attack: 0.045,
        curve: "exp",
        decay: 0.385,
        noise: 0,
        tail: 1,
        bright: 0,
        ring: 1,
      },
    ],
    shimmer: { delay: 0.16, feedback: 0.28, wet: 0.18, lowpass: 3200 },
  },
} satisfies Record<string, Sound>;

export type CuelumeName = keyof typeof cuelume;

/** Every cuelume sound name. */
export const cuelumeNames = Object.keys(cuelume) as CuelumeName[];
