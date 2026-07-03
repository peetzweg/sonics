import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      plinkjs: fileURLToPath(new URL("../../packages/plink/src/index.ts", import.meta.url)),
    },
  },
});
