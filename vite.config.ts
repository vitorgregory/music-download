// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/api": "http://127.0.0.1:5000",
        "/analyze_link": "http://127.0.0.1:5000",
        "/download": "http://127.0.0.1:5000",
        "/submit_selection": "http://127.0.0.1:5000",
        "/skip_selection": "http://127.0.0.1:5000",
        "/get_config": "http://127.0.0.1:5000",
        "/save_config": "http://127.0.0.1:5000",
        "/socket.io": { target: "http://127.0.0.1:5000", ws: true },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
