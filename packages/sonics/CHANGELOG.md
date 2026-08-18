# sonics

## 0.2.0

### Minor Changes

- 380392f: Extend the tick spec so a sound can be more than a struck resonator, and ship the cuelume palette as an add-on kit.

  `Tick` gains six optional fields — `attack`, `curve`, `wave`, `filter`, `glideTo`/`glideTime`, and `ring` — and `Sound` gains `shimmer`, a short low-passed feedback delay. Every one of them is optional and defaults to the previous behaviour, so existing specs, encoded strings and presets are unchanged; the built-in presets render bit-identically.

  New `register(name, spec)` / `register(kit)` teaches `play()` extra names, and `registered()` lists everything it answers to.

  New `sonics/presets` subpath exports `cuelume`: the seventeen interaction sounds designed by Daniel Belyi for [cuelume](https://github.com/Danilaa1/cuelume) (MIT), ported to sonics specs so they can be tweaked in the playground, shared as encoded strings, and baked to WAV. It is a separate entry point, so the core bundle only grows for consumers who import it.

### Patch Changes

- 081fcda: Packaging fixes for correct types + tree-shaking:

  - Split the `exports` `types` per condition (`import` → `.d.mts`, `require` → `.d.ts`) so ESM consumers get ESM-interpreted types.
  - The React bindings now import the core by package name, so an ESM consumer loads the ESM core (one shared `AudioContext`, not a duplicate CJS instance).
  - Ship the library ESM **unminified** and mark the default export `/* @__PURE__ */`, so bundlers can tree-shake: `import { play }` now drops unused code like `render`/`toWav`.
  - Add `type`/`engines` fields. Verified with `publint` and `are-the-types-wrong`.

## 0.1.0

### Minor Changes

- b726df7: Initial release. `sonics` synthesises tasteful, dependency-free UI microinteraction sounds in the browser with the Web Audio API — no audio files. Ships a small set of presets (click, tap, tick, pop, toggle on/off, success, error), a serialisable sound spec with `encode`/`decode`, WAV export, and React bindings (`sonics/react`).
