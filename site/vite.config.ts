import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Point the site at the library *source* so the playground runs without a
// separate build step during development.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "plinkjs/react": fileURLToPath(new URL("../packages/plink/src/react/index.tsx", import.meta.url)),
      plinkjs: fileURLToPath(new URL("../packages/plink/src/index.ts", import.meta.url)),
    },
  },
  base: "./",
});
