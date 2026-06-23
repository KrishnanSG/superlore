import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import {
  remarkSuperlore,
  remarkSuperloreCallouts,
  remarkSuperloreCanvas,
  remarkSuperloreChecklist,
} from "./mdx";

// Compile through the REAL MDX pipeline (remark-gfm first, then the superlore upgrade) — the same
// order the runtime and the docs build use — and assert on the emitted JS. This pins the markdown-
// first behavior that, when it regressed, shipped an empty <Checklist> with no test to catch it.
async function toJs(md: string, plugins: unknown[]): Promise<string> {
  const out = await compile(md, {
    remarkPlugins: [remarkGfm, ...plugins] as never,
  });
  return String(out);
}

describe("remarkSuperloreChecklist", () => {
  it("upgrades a `- [ ]` task list to <Checklist>, not a raw checkbox list", async () => {
    const js = await toJs("- [ ] alpha\n- [x] beta\n", [remarkSuperloreChecklist]);
    expect(js).toMatch(/Checklist/);
    expect(js).toContain("alpha");
    expect(js).toContain("beta");
    expect(js).not.toContain("checkbox"); // not a GFM <input type=checkbox> list
  });

  it("flattens nested task items so none are dropped", async () => {
    const js = await toJs("- [ ] parent\n  - [x] child\n", [remarkSuperloreChecklist]);
    expect(js).toContain("parent");
    expect(js).toContain("child"); // the nested item survives into the checklist
  });

  it("leaves an ordinary (non-task) list untouched", async () => {
    const js = await toJs("- one\n- two\n", [remarkSuperloreChecklist]);
    expect(js).not.toMatch(/Checklist/);
  });
});

describe("remarkSuperloreCallouts", () => {
  it("upgrades a GitHub alert to the matching callout and consumes the marker", async () => {
    const js = await toJs("> [!WARNING]\n> be careful\n", [remarkSuperloreCallouts]);
    expect(js).toMatch(/Warning/);
    expect(js).toContain("be careful");
    expect(js).not.toContain("!WARNING"); // the [!WARNING] marker is stripped
  });

  it("maps IMPORTANT→Info and CAUTION→Danger", async () => {
    expect(await toJs("> [!IMPORTANT]\n> x\n", [remarkSuperloreCallouts])).toMatch(/Info/);
    expect(await toJs("> [!CAUTION]\n> x\n", [remarkSuperloreCallouts])).toMatch(/Danger/);
  });

  it("leaves a plain blockquote and an unknown marker untouched", async () => {
    expect(await toJs("> just a quote\n", [remarkSuperloreCallouts])).toMatch(/blockquote/);
    expect(await toJs("> [!FOO] hi\n", [remarkSuperloreCallouts])).toContain("!FOO");
  });
});

describe("remarkSuperloreCanvas", () => {
  it("turns a superlore-canvas fence into <Canvas>", async () => {
    const js = await toJs('```superlore-canvas\n{"nodes":[]}\n```\n', [remarkSuperloreCanvas]);
    expect(js).toMatch(/Canvas/);
  });
});

describe("remarkSuperlore (combined)", () => {
  it("applies all three upgrades in one pass", async () => {
    const md = "- [x] done\n\n> [!TIP]\n> hi\n\n```superlore-canvas\n{}\n```\n";
    const js = await toJs(md, [remarkSuperlore]);
    expect(js).toMatch(/Checklist/);
    expect(js).toMatch(/Tip/);
    expect(js).toMatch(/Canvas/);
  });
});
