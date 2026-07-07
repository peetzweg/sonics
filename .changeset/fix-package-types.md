---
"sonics": patch
---

Fix package types resolution and the React entry. Split the `exports` `types` per condition (`import` → `.d.mts`, `require` → `.d.ts`) so ESM consumers get ESM-interpreted types, and make the React bindings import the core by its package name so an ESM consumer loads the ESM core (one shared `AudioContext`, not a duplicate CJS instance). Adds `type`/`engines` fields. Verified with `publint` and `are-the-types-wrong`.
