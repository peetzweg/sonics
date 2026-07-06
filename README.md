# sonics 🔊

**Tiny, dependency-free UI sounds you can feel.** Synthesised live in the browser with the Web Audio API — no audio files, no network payload, ~3 KB.

sonics is the audio sibling of a haptics library: a small kit for adding _tasteful_ microinteraction sounds (clicks, taps, toggles, confirmations) to a web UI. Every sound is a plain, serialisable object — so you can design one in the playground, copy the spec, and drop it in anywhere.

```js
import sonics from "sonics";
sonics("click"); // that's it
```

> The audio sibling of [`web-haptics`](https://github.com/lochie/web-haptics): haptic feedback ↔ sonic feedback for the web.

## The story

The ElevenLabs onboarding has a genuinely lovely click. It turns out to be a lazy-loaded `click.mp3` — a _recording_. We measured it: two damped resonant "ticks" ~27 ms apart, both near 3.1 kHz, decaying in ~3 ms. That's the acoustic signature of a small mechanical switch — press, then release.

Once you can describe a sound in a handful of numbers, you don't need the file. sonics synthesises it live: a short noise burst (the strike) excites a band-pass filter (the resonant body), which rings and decays. Stack two ticks and you get the tactile press-release. The default `click` preset _is_ that ElevenLabs sound, rebuilt from ~30 lines of Web Audio.

## This repo

A pnpm monorepo (structure inspired by [web-haptics](https://github.com/lochie/web-haptics)):

```
packages/sonics   → the library (published as "sonics"): core + /react, built with tsup
site             → the playground: design a sound, hear it, export it
apps/react-example
apps/vanilla-example
```

## Develop

```sh
pnpm install
pnpm build          # build the library (tsup → packages/sonics/dist)
pnpm site:dev       # open the playground (Vite; imports the lib source directly)
pnpm example:react  # run the React example
pnpm example:vanilla
```

The `site` and examples alias `sonics` to the library **source**, so you can hack on the library and the playground together with no rebuild.

## The playground

`site/` is modelled on the design→export loop of [haptics.lochie.me](https://haptics.lochie.me/): pick a preset, shape it with per-tick sliders, watch the live waveform / spectrum, then export as a shareable string, a JS snippet, a permalink, or a baked WAV.

## Library docs

See [`packages/sonics/README.md`](./packages/sonics/README.md) for the full API (presets, the tick spec, `encode`/`decode`, `toWav`, and the React bindings).

## Credit

sonics occupies a specific empty cell: **synth-based** (not file playback), **tasteful UI** (not retro game SFX), tiny/zero-dep, with a designer. It stands on the shoulders of:

- **[ZzFX](https://github.com/KilledByAPixel/ZzFX)** — Frank Force. The sub-1 KB synth + designer + code-export pattern. (Aimed at retro game SFX.)
- **[web-haptics](https://github.com/lochie/web-haptics)** / **[haptics.lochie.me](https://haptics.lochie.me/)** — Lochie Axon. The sibling-modality library and the design→export loop this mirrors.
- **[sfxr](https://www.drpetter.se/project_sfxr.html)** (DrPetter) and its web ports **[jsfxr](https://github.com/chr15m/jsfxr)** (chr15m) / **[jfxr](https://jfxr.frozenfractal.com/)** (ttencate).
- **[snd-lib](https://snd.dev/)** — DENTSU INC. + STARRYWORKS inc. The tasteful-UI-sound aesthetic (a crafted sample kit).
- **[use-sound](https://github.com/joshwcomeau/use-sound)** — Josh W. Comeau. For popularising "the web needs more (tasteful) sounds."
- **ElevenLabs** — whose onboarding click is the sound we reverse-engineered as the default preset.

## License

MIT © Philip Poloczek
