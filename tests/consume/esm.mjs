// ESM consumption of the BUILT package — must work under node and bun.
import assert from "node:assert/strict";
import sonics, { play, sound, presets, encode, decode, isSupported, register, registered } from "sonics";
import { cuelume, cuelumeNames } from "sonics/presets";

assert.equal(typeof sonics, "function", "default export is callable");
assert.equal(typeof sonics.play, "function", "default carries the api");
assert.ok(Object.keys(presets).length >= 8, "presets present");
assert.deepEqual(decode(encode(presets.click)), presets.click, "encode/decode round-trips");
assert.equal(typeof isSupported(), "boolean", "isSupported returns a boolean");
assert.doesNotThrow(() => play("click"), "play is safe without audio");
assert.equal(typeof sound("tap"), "function", "sound returns a trigger");

// The add-on kit resolves through its own subpath and is plain, shareable data.
assert.equal(cuelumeNames.length, 17, "cuelume kit ships 17 sounds");
assert.deepEqual(decode(encode(cuelume.arrival)), cuelume.arrival, "kit specs round-trip");
assert.ok(cuelume.droplet.ticks[0].glideTo > 0, "glide survives the build");
assert.ok(cuelume.chime.shimmer.feedback > 0, "shimmer survives the build");

register(cuelume);
assert.equal(registered().arrival, cuelume.arrival, "register() teaches play() the kit");
assert.doesNotThrow(() => play("arrival"), "registered names are safe without audio");

console.log(
  `[esm] ok — ${Object.keys(presets).length} presets + ${cuelumeNames.length} cuelume, runtime: ${globalThis.Bun ? "bun" : "node"}`
);
