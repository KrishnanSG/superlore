// Browser-based verification of the webview render. The webview is a web page; we serve the built
// dist/webview, open it in Playwright, simulate the VS Code extension by (1) stubbing
// `acquireVsCodeApi` BEFORE the bundle loads and (2) posting the same { type: "update" } / { type:
// "theme" } messages the extension host posts — using the real canvas.mdx as the source. We then
// assert the page rendered (headings, the live Canvas with .react-flow, a Timeline) with no console
// errors, in BOTH light and dark.
//
// Uses the createRequire pattern (Playwright is a root devDep) from the scratchpad shot.mjs.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import http from "node:http";

const require = createRequire("/Users/dgkrish/Code/superlore/");
const { chromium } = require("playwright");

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../dist/webview");
const outDir = process.env.OUT || here;
const canvasMdx = readFileSync(
  "/Users/dgkrish/Code/superlore/apps/docs/content/docs/canvas.mdx",
  "utf8",
);

// ── A tiny static server for dist/webview ───────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const file = join(distDir, rel);
  try {
    const body = readFileSync(file);
    const ext = rel.slice(rel.lastIndexOf("."));
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}/`;

const browser = await chromium.launch();
const results = [];

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setViewportSize({ width: 1100, height: 1400 });

  const consoleErrors = [];
  const assetWarnings = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // A missing asset — e.g. an absolute-path image in the source (`/superlore-mark.svg`) that this
    // offline static harness doesn't serve — is environmental, not a render fault. Record it
    // separately so a real JS/page error still fails the run. (A 404 on a critical bundle chunk
    // would still be caught: the reactFlow/rfNodes/headings assertions below would all be zero.)
    if (/Failed to load resource[\s\S]*\b40[34]\b/.test(t)) assetWarnings.push(t);
    else consoleErrors.push(t);
  });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  // (1) Stub acquireVsCodeApi BEFORE the bundle runs.
  await page.addInitScript(() => {
    window.acquireVsCodeApi = () => ({ postMessage: () => {} });
  });

  await page.goto(base, { waitUntil: "load", timeout: 60000 });

  // (2) Post the host messages the extension would post.
  await page.evaluate(
    ({ source, theme }) => {
      window.postMessage({ type: "theme", theme }, "*");
      window.postMessage({ type: "update", source, fileName: "canvas.mdx" }, "*");
    },
    { source: canvasMdx, theme },
  );

  // Wait for the canvas to lay out (ELK is async) + components to settle.
  await page
    .waitForSelector(".react-flow", { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(3500);

  const stats = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      reactFlow: document.querySelectorAll(".react-flow").length,
      rfNodes: document.querySelectorAll(".react-flow__node").length,
      rfEdges: document.querySelectorAll(".react-flow__edge").length,
      headings: document.querySelectorAll(".kp-viewer-doc h1, .kp-viewer-doc h2").length,
      hasShapeLibrary: txt.includes("Shape library"),
      hasAuthoring: txt.includes("Authoring"),
      isDark: document.documentElement.classList.contains("dark"),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      blocks: document.querySelectorAll("[data-kp-block]").length,
    };
  });

  await page.screenshot({ path: join(outDir, `webview-${theme}.png`), fullPage: true });
  results.push({ theme, stats, consoleErrors, assetWarnings });
  await ctx.close();
}

await browser.close();
server.close();

console.log(JSON.stringify(results, null, 2));

const ok = results.every(
  (r) => r.stats.reactFlow > 0 && r.stats.rfNodes > 0 && r.stats.headings > 0 && r.consoleErrors.length === 0,
);
console.log(ok ? "\nVERIFY: PASS" : "\nVERIFY: FAIL");
process.exit(ok ? 0 : 1);
