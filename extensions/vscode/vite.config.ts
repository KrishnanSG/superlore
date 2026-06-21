import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const here = dirname(fileURLToPath(import.meta.url));

// The webview is a plain Vite + React + Tailwind v4 app rendering the SAME MDX pipeline the
// superlore Viewer uses. Output lands in dist/webview; the extension host loads dist/webview/index.html
// and rewrites the (relative, base:"./") asset URLs to webview-safe URIs via asWebviewUri.
export default defineConfig({
  root: resolve(here, "webview"),
  // Relative base so built assets reference "./assets/...", which the extension rewrites to
  // asWebviewUri(...) under localResourceRoots.
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // superlore's Canvas uses `next/dynamic`; there's no Next here, so swap in a tiny shim.
      "next/dynamic": resolve(here, "webview/src/shims/next-dynamic.tsx"),
    },
  },
  define: {
    // Some deps branch on this; the webview is always a production bundle.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: resolve(here, "dist/webview"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    // Emit ONE stylesheet, linked statically in index.html. With CSS code-splitting on, the
    // canvas (a lazy chunk) ships its styles in a separate CSS file that Vite injects at runtime
    // via a relative/crossorigin <link> the webview can't load — so shapes/colours silently
    // disappear. A single static stylesheet is rewritten + crossorigin-stripped by the host.
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Stable-ish, hashed names under assets/ so the extension's URL-rewrite matches.
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  // elkjs ships a CJS bundle; let Vite optimize it ahead of time.
  optimizeDeps: {
    include: ["elkjs/lib/elk.bundled.js"],
  },
});
