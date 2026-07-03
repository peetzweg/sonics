import type { Sound, Tick } from "plinkjs";

export type Param = {
  key: keyof Tick;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  scale: number; // display multiplier (e.g. seconds -> ms)
  fx: number; // display decimal places
};

// Primary functions (knob default) and their alt (shift/alt) partners.
// Order pairs up: knob i = PRIMARY[i] / SECONDARY[i].
export const PRIMARY: Param[] = [
  { key: "at", label: "time", min: 0, max: 0.2, step: 0.001, unit: "ms", scale: 1000, fx: 1 },
  { key: "gain", label: "gain", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
  { key: "q", label: "q", min: 1, max: 20, step: 0.5, unit: "", scale: 1, fx: 1 },
  { key: "bright", label: "brightness", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
];

export const SECONDARY: Param[] = [
  { key: "freq", label: "resonance", min: 200, max: 6000, step: 10, unit: "hz", scale: 1, fx: 0 },
  { key: "decay", label: "decay", min: 0.001, max: 0.03, step: 0.0005, unit: "ms", scale: 1000, fx: 1 },
  { key: "tail", label: "tail", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
  { key: "noise", label: "noise", min: 0, max: 1, step: 0.01, unit: "", scale: 1, fx: 2 },
];

export const DEF: Record<string, number> = {
  at: 0,
  gain: 0.5,
  freq: 3120,
  q: 7,
  decay: 0.0032,
  noise: 1,
  tail: 0.6,
  bright: 0.55,
};

export const valueOf = (tick: Tick, key: keyof Tick): number =>
  (tick[key] as number | undefined) ?? DEF[key];

export const fmt = (p: Param, v: number) =>
  (v * p.scale).toFixed(p.fx) + (p.unit ? " " + p.unit : "");

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const snap = (v: number, step: number) => Math.round(v / step) * step;

/** A fresh tick with sensible defaults. */
export const newTick = (at = 0.03, freq = 3120): Tick => ({
  at: snap(at, 0.001),
  gain: 0.5,
  freq,
  q: 7,
  decay: 0.0032,
  noise: 1,
  tail: 0.6,
  bright: 0.55,
});

/** Random values across every parameter (and 1-4 ticks). */
export function shuffleSpec(): Sound {
  const weights = [1, 1, 2, 2, 2, 3, 3, 4];
  const n = weights[Math.floor(Math.random() * weights.length)];
  const ticks: Tick[] = [];
  let at = 0;
  for (let i = 0; i < n; i++) {
    const freq = Math.exp(rand(Math.log(380), Math.log(5200))); // log-random spread
    ticks.push({
      at: snap(at, 0.001),
      gain: snap(rand(0.35, 0.7), 0.01),
      freq: snap(freq, 10),
      q: snap(rand(2, 14), 0.5),
      decay: snap(rand(0.0015, 0.02), 0.0005),
      noise: snap(rand(0, 1), 0.01),
      tail: snap(rand(0.1, 1), 0.01),
      bright: snap(rand(0, 1), 0.01),
    });
    at += rand(0.02, 0.09);
  }
  return { volume: snap(rand(0.7, 1), 0.01), ticks };
}
