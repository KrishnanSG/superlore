import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Pin Tailwind's base so PostCSS resolves `@import "tailwindcss"` from this app's node_modules.
export default {
  plugins: {
    "@tailwindcss/postcss": {
      base: projectRoot,
    },
  },
};
