// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages: set VITE_BASE=/TaylorAI/ in CI → SPA static shell, no Nitro/Cloudflare worker.
// Lovable / local default: leave VITE_BASE unset → Nitro cloudflare-module (unchanged).
const pagesBase = process.env.VITE_BASE || "/";
const isGitHubPages = Boolean(process.env.VITE_BASE && process.env.VITE_BASE !== "/");

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    ...(isGitHubPages ? { spa: { enabled: true } } : {}),
  },
  nitro: isGitHubPages ? false : undefined,
  vite: {
    base: pagesBase,
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  },
});
