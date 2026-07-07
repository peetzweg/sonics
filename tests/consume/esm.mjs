// ESM consumption of the BUILT package — must work under node and bun.
import assert from "node:assert/strict";
import sonics, { play, sound, presets, encode, decode, isSupported } from "sonics";

assert.equal(typeof sonics, "function", "default export is callable");
assert.equal(typeof sonics.play, "function", "default carries the api");
assert.ok(Object.keys(presets).length >= 8, "presets present");
assert.deepEqual(decode(encode(presets.click)), presets.click, "encode/decode round-trips");
assert.equal(typeof isSupported(), "boolean", "isSupported returns a boolean");
assert.doesNotThrow(() => play("click"), "play is safe without audio");
assert.equal(typeof sound("tap"), "function", "sound returns a trigger");

console.log(`[esm] ok — ${Object.keys(presets).length} presets, runtime: ${globalThis.Bun ? "bun" : "node"}`);
