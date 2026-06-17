import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/src/engine/")) return "engine";
          if (id.includes("/src/lib/")) return "services";
        },
      },
    },
  },
});
