import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      sonics: fileURLToPath(new URL("../../packages/sonics/src/index.ts", import.meta.url)),
    },
  },
});
