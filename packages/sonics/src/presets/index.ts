/*!
 * sonics/presets — add-on sound kits, kept out of the core bundle so the
 * base library stays tiny. Import a kit and either pass its specs straight to
 * `play()`, or `register()` the whole thing to play its sounds by name:
 *
 *   import { play, register } from "sonics";
 *   import { cuelume } from "sonics/presets";
 *
 *   play(cuelume.chime);   // always works
 *   register(cuelume);
 *   play("chime");         // works once registered
 */

export { cuelume, cuelumeNames, type CuelumeName } from "./cuelume";
