import { defineConfig } from "tsup";

/**
 * Builds the published CLI. Two entries: the `superlore` executable (`index`) and the
 * config module (`config`) — the canonical `superlore.json` type + loader, exported so
 * other packages and skills can import the schema without depending on the binary.
 * A shebang banner makes `dist/index.js` directly runnable. Dependencies are bundled
 * (light: cac + @clack/prompts) so the published CLI runs without a node_modules dance.
 */
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    dts: true,
    clean: true,
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { config: "src/config.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    dts: true,
    clean: false,
  },
]);
