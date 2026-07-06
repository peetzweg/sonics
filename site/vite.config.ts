import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Point the site at the library *source* so the playground runs without a
// separate build step during development.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "sonics/react": fileURLToPath(new URL("../packages/sonics/src/react/index.tsx", import.meta.url)),
      sonics: fileURLToPath(new URL("../packages/sonics/src/index.ts", import.meta.url)),
    },
  },
  base: "./",
});
