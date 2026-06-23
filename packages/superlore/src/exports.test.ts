import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The package ships TWO export maps: `exports` (dev → src) and `publishConfig.exports` (publish →
// dist). A subpath added to one but not the other is exactly how `./runtime.css` broke in 0.8.1 (in
// dev, missing from publish → "not exported" for consumers). These tests fail the moment they drift.
// vitest runs with cwd at the package root; read package.json from there (the jsdom env's
// `import.meta.url` is not a file: URL, so `new URL(..., import.meta.url)` can't be used here).
const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
  exports: Record<string, unknown>;
  publishConfig: { exports: Record<string, unknown> };
};

describe("package export maps", () => {
  const dev = pkg.exports;
  const pub = pkg.publishConfig.exports;

  it("dev and publishConfig expose the SAME subpaths", () => {
    expect(Object.keys(dev).sort()).toEqual(Object.keys(pub).sort());
  });

  it("ships the documented public subpaths", () => {
    for (const key of [
      ".",
      "./runtime",
      "./runtime.css",
      "./css",
      "./mdx",
      "./ui",
      "./source",
      "./next",
    ]) {
      expect(pub[key], `publishConfig missing ${key}`).toBeTruthy();
      expect(dev[key], `dev exports missing ${key}`).toBeTruthy();
    }
  });

  it("publishConfig targets resolve to dist, never src", () => {
    const targets = Object.values(pub).flatMap((v) =>
      typeof v === "string" ? [v] : Object.values(v as Record<string, string>),
    );
    for (const t of targets) expect(String(t)).not.toMatch(/\/src\//);
  });

  it("./runtime.css resolves to the precompiled stylesheet, not the raw Tailwind-source ./css", () => {
    expect(dev["./runtime.css"]).not.toBe(dev["./css"]);
    expect(String(pub["./runtime.css"])).toContain("superlore-runtime.css");
  });
});
