// Build the two CSS artifacts that ship in dist/css:
//
//   superlore.css          — the Tailwind-source theme preset (host runs Tailwind v4, scans our files).
//                            What `superlore/css` resolves to.
//   superlore-runtime.css  — a SELF-CONTAINED, precompiled stylesheet: the theme tokens, fumadocs
//                            preset, Shiki code styles, and every utility class superlore's components
//                            use, all emitted as static CSS. A host imports this ONE file (`superlore/
//                            runtime.css`) and the runtime renderer looks right with NO Tailwind on
//                            their side. Dark mode rides a `.dark` ancestor class (next-themes convention).
//
// Runs after tsdown (which emits the component JS the precompile scans via the theme's @source glob).
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { cpSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distCss = join(pkgDir, "dist", "css");
const require = createRequire(import.meta.url);

mkdirSync(distCss, { recursive: true });

// 1) Raw theme CSS — for in-monorepo dev and Tailwind-based hosts (`superlore/css`).
cpSync(join(pkgDir, "src", "theme", "superlore.css"), join(distCss, "superlore.css"));

// 2) Precompiled, portable CSS. Feed Tailwind an entry that pulls in Tailwind itself plus the theme
//    (which already imports the fumadocs preset and @source-scans the sibling compiled components).
const input = join(distCss, "_runtime-input.css");
const output = join(distCss, "superlore-runtime.css");
writeFileSync(input, '@import "tailwindcss";\n@import "./superlore.css";\n');

// Resolve the @tailwindcss/cli entry and run it on Node directly (robust across pnpm bin layouts).
const cliPkgPath = require.resolve("@tailwindcss/cli/package.json");
const cliPkg = require(cliPkgPath);
const binRel = typeof cliPkg.bin === "string" ? cliPkg.bin : cliPkg.bin.tailwindcss;
const cliBin = join(dirname(cliPkgPath), binRel);

try {
  execFileSync(process.execPath, [cliBin, "-i", input, "-o", output, "--minify"], {
    stdio: "inherit",
    cwd: pkgDir,
  });
} finally {
  rmSync(input, { force: true });
}

console.log("✓ dist/css/superlore.css + dist/css/superlore-runtime.css");
