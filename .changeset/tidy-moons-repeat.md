---
"sonics": minor
---

Extend the tick spec so a sound can be more than a struck resonator, and ship the cuelume palette as an add-on kit.

`Tick` gains six optional fields — `attack`, `curve`, `wave`, `filter`, `glideTo`/`glideTime`, and `ring` — and `Sound` gains `shimmer`, a short low-passed feedback delay. Every one of them is optional and defaults to the previous behaviour, so existing specs, encoded strings and presets are unchanged; the built-in presets render bit-identically.

New `register(name, spec)` / `register(kit)` teaches `play()` extra names, and `registered()` lists everything it answers to.

New `sonics/presets` subpath exports `cuelume`: the seventeen interaction sounds designed by Daniel Belyi for [cuelume](https://github.com/Danilaa1/cuelume) (MIT), ported to sonics specs so they can be tweaked in the playground, shared as encoded strings, and baked to WAV. It is a separate entry point, so the core bundle only grows for consumers who import it.
