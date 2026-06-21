// Tailwind's Vite plugin only scans `@source` paths INSIDE the Vite root, so it won't pick up the
// superlore package's component source (where the canvas `INTENT_CLASS` / `radiusClass` Tailwind
// classes live) from outside. Copy that source into the webview root (`webview/superlore-scan`, which
// `@source` scans) at build time so every superlore utility class is generated — zero drift, since it
// scans the real source. The copy is gitignored + vscodeignored and never bundled (nothing imports
// it; it exists only for Tailwind's class extraction).
import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "..", "packages", "superlore", "src");
const dest = join(here, "..", "webview", "superlore-scan");

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("[superlore-preview] synced superlore src → webview/superlore-scan for Tailwind class scanning");
