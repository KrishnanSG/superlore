import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SuperloreDoc, SuperloreTheme } from "./runtime";

// The scoped `superlore/runtime.css` defines default tokens ON `.superlore-doc`. So a host's brand
// tokens MUST be applied on that same element — set on an ancestor, the per-container defaults would
// override them for the doc subtree (the bug a host hit embedding the doc app-wide). These tests lock the
// contract: tokens + `data-theme` land on the `.superlore-doc` element, from props OR a SuperloreTheme.

const MDX = "# Title\n\nSome prose.";

async function docEl(ui: React.ReactElement): Promise<HTMLElement> {
  const { container } = render(ui);
  await waitFor(() => {
    if (!container.querySelector(".superlore-doc")) throw new Error("not rendered yet");
  });
  return container.querySelector(".superlore-doc") as HTMLElement;
}

describe("SuperloreDoc theming", () => {
  it("applies `tokens` as CSS variables on the .superlore-doc element itself", async () => {
    const el = await docEl(<SuperloreDoc source={MDX} tokens={{ accent: "rgb(1, 2, 3)" }} />);
    // accent → --kp-accent + --color-fd-primary + --color-fd-ring, all on the doc element (inline).
    expect(el.style.getPropertyValue("--kp-accent").trim()).toBe("rgb(1, 2, 3)");
    expect(el.style.getPropertyValue("--color-fd-primary").trim()).toBe("rgb(1, 2, 3)");
  });

  it("sets data-theme on the container for dark (no class on <html>)", async () => {
    const el = await docEl(<SuperloreDoc source={MDX} theme="dark" />);
    expect(el.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("omits data-theme when no theme is given (light is the container default)", async () => {
    const el = await docEl(<SuperloreDoc source={MDX} />);
    expect(el.hasAttribute("data-theme")).toBe(false);
  });

  it("receives tokens + theme from a surrounding SuperloreTheme via context (on the doc element)", async () => {
    const el = await docEl(
      <SuperloreTheme tokens={{ accent: "rgb(4, 5, 6)" }} theme="dark">
        <SuperloreDoc source={MDX} />
      </SuperloreTheme>,
    );
    expect(el.style.getPropertyValue("--kp-accent").trim()).toBe("rgb(4, 5, 6)");
    expect(el.getAttribute("data-theme")).toBe("dark");
  });

  it("lets explicit props win over a surrounding SuperloreTheme", async () => {
    const el = await docEl(
      <SuperloreTheme tokens={{ accent: "rgb(4, 5, 6)" }} theme="dark">
        <SuperloreDoc source={MDX} tokens={{ accent: "rgb(7, 8, 9)" }} theme="light" />
      </SuperloreTheme>,
    );
    expect(el.style.getPropertyValue("--kp-accent").trim()).toBe("rgb(7, 8, 9)");
    expect(el.getAttribute("data-theme")).toBe("light");
  });

  it("stamps the 'Powered by superlore' badge by default, linking to the site", async () => {
    const el = await docEl(<SuperloreDoc source={MDX} />);
    const badge = el.querySelector('a[aria-label="Powered by superlore"]');
    expect(badge).toBeTruthy();
    expect(badge?.getAttribute("href")).toContain("superlore");
  });

  it("hides the badge when badge={false}", async () => {
    const el = await docEl(<SuperloreDoc source={MDX} badge={false} />);
    expect(el.querySelector('a[aria-label="Powered by superlore"]')).toBeNull();
  });
});
