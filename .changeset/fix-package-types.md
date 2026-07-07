---
"sonics": patch
---

Packaging fixes for correct types + tree-shaking:

- Split the `exports` `types` per condition (`import` → `.d.mts`, `require` → `.d.ts`) so ESM consumers get ESM-interpreted types.
- The React bindings now import the core by package name, so an ESM consumer loads the ESM core (one shared `AudioContext`, not a duplicate CJS instance).
- Ship the library ESM **unminified** and mark the default export `/* @__PURE__ */`, so bundlers can tree-shake: `import { play }` now drops unused code like `render`/`toWav`.
- Add `type`/`engines` fields. Verified with `publint` and `are-the-types-wrong`.
