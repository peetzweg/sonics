import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "plinkjs/react": fileURLToPath(
        new URL("../../packages/plink/src/react/index.tsx", import.meta.url)
      ),
      plinkjs: fileURLToPath(new URL("../../packages/plink/src/index.ts", import.meta.url)),
    },
  },
});
