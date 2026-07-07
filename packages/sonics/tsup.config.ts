import { defineConfig, type Options } from "tsup";

export default defineConfig(() => {
  const shared: Partial<Options> = {
    format: ["cjs", "esm"],
    dts: true,
    target: "es2022",
    treeshake: true,
    // ship the library ESM unminified so consumers' bundlers can tree-shake it
    // (and so the /* @__PURE__ */ annotation on the default export survives)
    minify: false,
  };

  return [
    // Core — no dependencies
    {
      ...shared,
      entry: { index: "src/index.ts" },
      clean: true,
    },
    // React bindings — react is external
    {
      ...shared,
      entry: { "react/index": "src/react/index.tsx" },
      external: ["react", "react/jsx-runtime", "sonics"],
      banner: { js: '"use client";' },
    },
  ];
});
