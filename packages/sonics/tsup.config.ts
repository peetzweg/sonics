import { defineConfig, type Options } from "tsup";

export default defineConfig((options) => {
  const shared: Partial<Options> = {
    format: ["cjs", "esm"],
    dts: true,
    target: "es2022",
    treeshake: true,
    minify: !options.watch,
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
      external: ["react", "react/jsx-runtime", "../index.js"],
      banner: { js: '"use client";' },
    },
  ];
});
