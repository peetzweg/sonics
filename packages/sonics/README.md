# sonics

**Tiny, dependency-free UI sounds you can feel.** Synthesised in the browser with the Web Audio API — no audio files, no network payload, ~3 KB.

`sonics` is the audio sibling of a haptics library: a small kit for adding _tasteful_ microinteraction sounds (clicks, taps, toggles, confirmations) to a web UI. Every sound is a plain, serialisable object, so you can design one in the [Web Audio API playground](https://peetzweg.github.io/sonics/), copy the spec, and replay it anywhere.

```js
import sonics from "sonics";

sonics("click"); // that's it
```

## Install

```sh
npm install sonics
```

## Quick start

```js
import sonics, { play, armAutoUnlock } from "sonics";

// Browsers block audio until the first user gesture. Call once on load:
armAutoUnlock();

play("click"); // a built-in preset

const tap = sonics.sound("tap"); // bind a reusable trigger
button.addEventListener("click", tap);

play("click", { volume: 0.6, rate: 1.2, humanize: 0.5 }); // tweak per play
```

**Presets:** `click` · `tap` · `tick` · `pop` · `toggleOn` · `toggleOff` · `success` · `error`

## Roll your own

A sound is a spec — nothing more:

```js
const doorbell = {
  volume: 0.9,
  ticks: [
    { at: 0, gain: 0.5, freq: 2637, q: 8, decay: 0.006, tail: 0.9 }, // E7
    { at: 0.09, gain: 0.55, freq: 3520, q: 8, decay: 0.008, tail: 0.9 }, // A7
  ],
};
play(doorbell);
```

| Tick field | meaning                                  | default  |
| ---------- | ---------------------------------------- | -------- |
| `at`       | start time (s), relative to sound start  | `0`      |
| `gain`     | loudness of this tick (0..1)             | `0.5`    |
| `freq`     | resonant frequency (Hz)                  | `3120`   |
| `q`        | band-pass Q — higher = more tonal/ringy  | `7`      |
| `decay`    | amplitude decay time constant (s)        | `0.0032` |
| `noise`    | noise-burst "breath" mix (0..1)          | `1`      |
| `tail`     | pure resonant sine tail level (0..1)     | `0.6`    |
| `bright`   | high attack "tick" transient (0..1)      | `0.55`   |
| `partial`  | high-partial multiplier (`freq*partial`) | `3.3`    |

Beyond the struck-resonator core, a tick can also be a plain voice — a tone
that swells, glides, or breathes:

| Tick field  | meaning                                      | default      |
| ----------- | -------------------------------------------- | ------------ |
| `attack`    | fade-in time (s) — raise it for swells       | `0.0004`     |
| `curve`     | fade-in shape: `"linear"` or `"exp"`         | `"linear"`   |
| `wave`      | oscillator shape for tail + partial          | `"sine"`     |
| `filter`    | filter type for the noise burst              | `"bandpass"` |
| `glideTo`   | glide the tail from `freq` to this Hz        | —            |
| `glideTime` | how long the glide takes (s)                 | `decay`      |
| `ring`      | how much longer the tail rings than the body | `1.25`       |

`decay` is measured from the tick's start, so a long `attack` eats into it
rather than stretching the tick. Set `ring: 1` when you want a plain tone whose
decay means exactly what it says.

A whole sound can also carry a `shimmer` — a short low-passed feedback delay,
the "air" that makes a chime sound like it is in a room rather than in a wire:

```js
play({
  volume: 0.5,
  ticks: [
    {
      freq: 1046.5,
      gain: 0.36,
      attack: 0.006,
      curve: "exp",
      decay: 0.23,
      noise: 0,
      tail: 1,
      bright: 0,
      ring: 1,
    },
  ],
  shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
});
```

## The cuelume kit

Seventeen designed interaction sounds by [Daniel Belyi](https://github.com/Danilaa1/cuelume)
(MIT), ported to sonics specs and shipped from a separate subpath so the core
stays small — you only pay the ~2.8 KB gzipped if you import it:

```js
import { play, register } from "sonics";
import { cuelume } from "sonics/presets";

play(cuelume.chime); // pass the spec directly — always works

register(cuelume); // or teach sonics the names
play("arrival");
```

`chime` · `sparkle` · `droplet` · `bloom` · `whisper` · `tick` · `press` ·
`release` · `toggle` · `success` · `error` · `page` · `loading` · `ready` ·
`pulse` · `scan` · `arrival`

Because they are ordinary specs, they behave like everything else here: open one
in the playground and drag its sliders, `encode()` it into a permalink, or
`toWav()` it into a file.

`register(name, spec)` also works for your own sounds — it is how you give
anything a name that `play()` answers to. Registered names shadow the built-in
presets, and `registered()` returns everything `play()` currently knows.

## Design & export

```js
import { encode, decode, toWav } from "sonics";

const str = encode(mySpec); // URL-safe, shareable string
play(decode(str)); // replay anywhere

const blob = await toWav("click"); // bake to a 16-bit WAV Blob if you prefer a file
```

## React

Zero extra dependencies — React is a peer.

```jsx
import { SonicsProvider, useSound, SonicsButton, useSonics } from "sonics/react";

function App() {
  return (
    <SonicsProvider>
      <Toolbar />
    </SonicsProvider>
  );
}

function Toolbar() {
  const save = useSound("click");
  const { enabled, toggle } = useSonics();
  return (
    <>
      <button
        onClick={() => {
          doSave();
          save();
        }}
      >
        Save
      </button>
      <SonicsButton sound="toggleOn" onClick={next}>
        Next
      </SonicsButton>
      <label>
        <input type="checkbox" checked={enabled} onChange={toggle} /> Sound
      </label>
    </>
  );
}
```

- `<SonicsProvider>` — shared enabled/volume state, persisted, defaults off under `prefers-reduced-motion`, arms auto-unlock.
- `useSound(sound, opts)` — a stable trigger callback.
- `useSonics()` — `{ enabled, setEnabled, toggle, volume, setVolume, play }`; safe without a provider.
- `<SonicsButton>` — a button (or any `as=` element) that plays on `click` / `pointerdown` / `hover`.

## Good-citizen defaults

- Won't play in a background tab (`document.hidden`).
- One shared `AudioContext`, resumed on first gesture via `armAutoUnlock()`.
- Global `setMuted()` / `setVolume()`; the React provider wires these to a persisted toggle and respects `prefers-reduced-motion`.

## Credit

`sonics` occupies a specific empty cell: **synth-based** (not file playback), **tasteful UI** (not retro game SFX), tiny/zero-dep, with a designer. It stands on the shoulders of [ZzFX](https://github.com/KilledByAPixel/ZzFX) (Frank Force), [web-haptics](https://github.com/lochie/web-haptics) (Lochie Axon — the sibling-modality design→export loop this mirrors), [sfxr](https://www.drpetter.se/project_sfxr.html) (DrPetter) and its web ports [jsfxr](https://github.com/chr15m/jsfxr) / [jfxr](https://jfxr.frozenfractal.com/), [snd-lib](https://snd.dev/), and [use-sound](https://github.com/joshwcomeau/use-sound) (Josh W. Comeau). The default `click` preset was reverse-engineered from the ElevenLabs onboarding sound. See the root README for the full story.

The seventeen sounds in `sonics/presets` are the [cuelume](https://github.com/Danilaa1/cuelume)
palette — designed by **Daniel Belyi**, MIT-licensed, ported here with the
licence notice kept intact in `src/presets/cuelume.ts`. The sound design is
theirs; only the translation into sonics specs is ours.

## License

MIT © Philip Poloczek
