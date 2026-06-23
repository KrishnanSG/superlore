import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "./index.js";

/**
 * The `VERSION` constant cac prints for `superlore --version` is a hand-maintained literal. If it
 * drifts from package.json (e.g. a release bumps package.json but not the constant), the CLI reports
 * a wrong version. This test fails the moment they diverge — pre-merge, before any publish.
 */
describe("CLI VERSION", () => {
  it("matches package.json version", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      version: string;
    };
    expect(VERSION).toBe(pkg.version);
  });
});
