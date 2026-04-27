import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/main/main.ts")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/preload/preload.ts")
      }
    }
  },
  renderer: {
    root: ".",
    plugins: [react({})],
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: resolve(__dirname, "index.html")
      }
    }
  }
});
