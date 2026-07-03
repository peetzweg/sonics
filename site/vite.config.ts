import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

// Point the site at the library *source* so the playground runs without a
// separate build step during development.
export default defineConfig({
  resolve: {
    alias: {
      "plinkjs/react": fileURLToPath(new URL("../packages/plink/src/react/index.tsx", import.meta.url)),
      plinkjs: fileURLToPath(new URL("../packages/plink/src/index.ts", import.meta.url)),
    },
  },
  base: "./",
});
