import { describe, it, expect } from "vitest";
import sonics, {
  play,
  sound,
  presets,
  encode,
  decode,
  render,
  isSupported,
  DEFAULT_TICK,
  type Sound,
} from "../src/index";

const PRESET_NAMES = Object.keys(presets) as Array<keyof typeof presets>;

describe("presets", () => {
  it("ships the documented set", () => {
    expect(PRESET_NAMES).toEqual(
      expect.arrayContaining(["click", "tap", "tick", "pop", "toggleOn", "toggleOff", "success", "error"])
    );
  });

  it("every preset has at least one well-formed tick", () => {
    for (const name of PRESET_NAMES) {
      const spec = presets[name];
      expect(spec.ticks.length).toBeGreaterThan(0);
      for (const t of spec.ticks) {
        if (t.freq !== undefined) expect(t.freq).toBeGreaterThan(0);
        if (t.decay !== undefined) expect(t.decay).toBeGreaterThan(0);
        if (t.gain !== undefined) expect(t.gain).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("the default click is the ElevenLabs-style double tick ~27.6ms apart", () => {
    const [a, b] = presets.click.ticks;
    expect(presets.click.ticks).toHaveLength(2);
    expect((b.at ?? 0) - (a.at ?? 0)).toBeCloseTo(0.0276, 4);
    expect(a.freq).toBe(3120);
  });
});

describe("encode / decode", () => {
  it("round-trips every preset", () => {
    for (const name of PRESET_NAMES) {
      expect(decode(encode(presets[name]))).toEqual(presets[name]);
    }
  });

  it("round-trips a custom spec, unicode-safe", () => {
    const spec: Sound = { name: "dörbell — 🔔", volume: 0.8, ticks: [{ at: 0, freq: 2637 }] };
    expect(decode(encode(spec))).toEqual(spec);
  });

  it("produces a URL-safe string (no + / =)", () => {
    expect(encode(presets.click)).not.toMatch(/[+/=]/);
  });

  it("throws on a garbage string", () => {
    expect(() => decode("!!!not-base64!!!")).toThrow();
  });
});

describe("engine surface", () => {
  it("reports no Web Audio in Node", () => {
    expect(isSupported()).toBe(false);
  });

  it("play / sound are no-throw when unsupported", () => {
    expect(() => play("click")).not.toThrow();
    expect(() => sonics("click")).not.toThrow();
    const trigger = sound("tap");
    expect(typeof trigger).toBe("function");
    expect(() => trigger()).not.toThrow();
  });

  it("render rejects without an (Offline)AudioContext", async () => {
    await expect(render("click")).rejects.toThrow();
  });

  it("exposes the default tick shape", () => {
    expect(DEFAULT_TICK).toMatchObject({ freq: 3120, q: 7, decay: 0.0032 });
  });

  it("default export is callable and carries the API", () => {
    expect(typeof sonics).toBe("function");
    expect(typeof sonics.play).toBe("function");
    expect(typeof sonics.encode).toBe("function");
    expect(sonics.presets).toBe(presets);
  });
});
