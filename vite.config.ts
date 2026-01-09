import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@domain": path.resolve(__dirname, "src/domain"),
      "@app": path.resolve(__dirname, "src/app"),
      "@infra": path.resolve(__dirname, "src/infrastructure"),
      "@ui": path.resolve(__dirname, "src/renderer")
    }
  },
  build: {
    outDir: "dist/renderer"
  }
});
