import { describe, it, expect, beforeEach } from "vitest";
import {
  presets,
  encode,
  decode,
  play,
  register,
  registered,
  DEFAULT_TICK,
  type Sound,
} from "../src/index";
import { cuelume, cuelumeNames } from "../src/presets/cuelume";

const NAMES = cuelumeNames;

describe("the cuelume kit", () => {
  it("ships all seventeen sounds", () => {
    expect(NAMES).toHaveLength(17);
    expect(NAMES).toEqual([
      "chime",
      "sparkle",
      "droplet",
      "bloom",
      "whisper",
      "tick",
      "press",
      "release",
      "toggle",
      "success",
      "error",
      "page",
      "loading",
      "ready",
      "pulse",
      "scan",
      "arrival",
    ]);
  });

  it("is plain serialisable data — every sound round-trips through encode/decode", () => {
    for (const name of NAMES) {
      expect(decode(encode(cuelume[name]))).toEqual(cuelume[name]);
    }
  });

  it("every tick is well-formed", () => {
    for (const name of NAMES) {
      const spec = cuelume[name];
      expect(spec.ticks.length).toBeGreaterThan(0);
      for (const t of spec.ticks) {
        expect(t.freq!).toBeGreaterThan(0);
        expect(t.decay!).toBeGreaterThan(0);
        expect(t.gain!).toBeGreaterThan(0);
        expect(t.at!).toBeGreaterThanOrEqual(0);
        // decay is measured from the tick's start, so it must outlast the attack
        expect(t.decay!).toBeGreaterThan(t.attack!);
        if (t.glideTo !== undefined) expect(t.glideTo).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every shimmer's feedback under unity so it cannot run away", () => {
    for (const name of NAMES) {
      const sh = cuelume[name].shimmer;
      if (!sh) continue;
      expect(sh.feedback).toBeGreaterThan(0);
      expect(sh.feedback).toBeLessThan(1);
      expect(sh.delay).toBeGreaterThan(0);
      expect(sh.delay).toBeLessThanOrEqual(1); // DelayNode is created with maxDelay 1
    }
  });

  it("does not silently collide with a built-in preset name", () => {
    // `tick`, `success` and `error` exist in both kits — that is fine, but it
    // must be a deliberate shadow rather than an accident, so pin the list.
    const overlap = NAMES.filter((n) => n in presets);
    expect(overlap).toEqual(["tick", "success", "error"]);
  });
});

describe("register", () => {
  beforeEach(() => {
    register("click", presets.click); // reset any shadowing between tests
  });

  it("teaches play() a new name", () => {
    const doorbell: Sound = { ticks: [{ freq: 2637 }] };
    register("doorbell", doorbell);
    expect(registered().doorbell).toBe(doorbell);
    expect(() => play("doorbell")).not.toThrow();
  });

  it("registers a whole kit at once", () => {
    register(cuelume);
    const all = registered();
    for (const name of NAMES) expect(all[name]).toBe(cuelume[name]);
  });

  it("lets a registered name shadow a built-in preset", () => {
    register(cuelume);
    expect(registered().tick).toBe(cuelume.tick);
    expect(registered().tick).not.toBe(presets.tick);
  });

  it("still resolves unregistered names to built-in presets", () => {
    expect(registered().pop).toBe(presets.pop);
  });

  it("does not invent names nobody registered", () => {
    expect(registered()).not.toHaveProperty("nope-not-a-sound");
    // play() bails before name resolution when Web Audio is absent (as in Node),
    // so an unknown name is a silent no-op here rather than a throw.
    expect(() => play("nope-not-a-sound")).not.toThrow();
  });
});

describe("the extended tick spec", () => {
  it("defaults preserve the original behaviour", () => {
    expect(DEFAULT_TICK).toMatchObject({
      attack: 0.0004,
      curve: "linear",
      wave: "sine",
      filter: "bandpass",
      ring: 1.25,
    });
  });

  it("existing presets never set the new fields, so they are unchanged", () => {
    for (const spec of Object.values(presets)) {
      expect(spec).not.toHaveProperty("shimmer");
      for (const t of spec.ticks) {
        for (const key of ["attack", "curve", "wave", "filter", "glideTo", "glideTime", "ring"]) {
          expect(t).not.toHaveProperty(key);
        }
      }
    }
  });
});
