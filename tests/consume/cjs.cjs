// CJS consumption of the BUILT package — must work under node and bun.
const assert = require("node:assert/strict");
const sonics = require("sonics");

const api = sonics.default ?? sonics;
assert.equal(typeof api, "function", "default export is callable");
assert.equal(typeof sonics.play, "function", "named play present");
assert.ok(Object.keys(sonics.presets).length >= 8, "presets present");
assert.deepEqual(
  sonics.decode(sonics.encode(sonics.presets.tap)),
  sonics.presets.tap,
  "encode/decode round-trips"
);
assert.doesNotThrow(() => sonics.play("tap"), "play is safe without audio");

console.log(`[cjs] ok — runtime: ${globalThis.Bun ? "bun" : "node"}`);
