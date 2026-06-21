import { describe, expect, it } from "vitest";

import {
  DEFAULT_MCP_PATH,
  parseSuperloreJson,
  resolveMcpPath,
  serializeSuperloreJson,
  validateSuperloreJson,
  type SuperloreJson,
} from "./config.js";

describe("validateSuperloreJson", () => {
  it("accepts a minimal valid config", () => {
    const result = validateSuperloreJson({ name: "Acme", type: "company-kb" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: "Acme", type: "company-kb" });
    }
  });

  it("requires name and type", () => {
    const result = validateSuperloreJson({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((i) => i.path)).toEqual(["name", "type"]);
    }
  });

  it("rejects an unknown type", () => {
    const result = validateSuperloreJson({ name: "x", type: "wiki" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe("type");
  });

  it("defaults auth.provider to google when auth is enabled", () => {
    const result = validateSuperloreJson({
      name: "x",
      type: "company-kb",
      auth: { enabled: true },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.auth?.provider).toBe("google");
  });

  it("defaults mcp.path when mcp is enabled without a path", () => {
    const result = validateSuperloreJson({
      name: "x",
      type: "product-docs",
      mcp: { enabled: true },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.mcp?.path).toBe(DEFAULT_MCP_PATH);
  });

  it("omits mcp.path when mcp is disabled", () => {
    const result = validateSuperloreJson({
      name: "x",
      type: "product-docs",
      mcp: { enabled: false },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.mcp).toEqual({ enabled: false });
  });

  it("rejects a non-rooted mcp.path", () => {
    const result = validateSuperloreJson({
      name: "x",
      type: "product-docs",
      mcp: { enabled: true, path: "api/mcp" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe("mcp.path");
  });

  it("rejects a non-google auth provider", () => {
    const result = validateSuperloreJson({
      name: "x",
      type: "company-kb",
      auth: { enabled: true, provider: "github" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe("auth.provider");
  });

  it("keeps an explicit accent and allowedDomain", () => {
    const result = validateSuperloreJson({
      name: "Acme",
      type: "company-kb",
      accent: "#FF6633",
      auth: { enabled: true, allowedDomain: "acme.com" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accent).toBe("#FF6633");
      expect(result.value.auth?.allowedDomain).toBe("acme.com");
    }
  });
});

describe("parseSuperloreJson", () => {
  it("reports a JSON syntax error as an issue", () => {
    const result = parseSuperloreJson("{ not json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toContain("not valid JSON");
  });

  it("round-trips through serialize", () => {
    const config: SuperloreJson = {
      name: "Acme",
      type: "company-kb",
      auth: { enabled: true, provider: "google" },
      mcp: { enabled: true, path: DEFAULT_MCP_PATH },
    };
    const result = parseSuperloreJson(serializeSuperloreJson(config));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(config);
  });
});

describe("resolveMcpPath", () => {
  it("returns the default when enabled and unset", () => {
    expect(resolveMcpPath({ name: "x", type: "product-docs", mcp: { enabled: true } })).toBe(
      DEFAULT_MCP_PATH,
    );
  });

  it("returns undefined when mcp is absent or disabled", () => {
    expect(resolveMcpPath({ name: "x", type: "product-docs" })).toBeUndefined();
    expect(
      resolveMcpPath({ name: "x", type: "product-docs", mcp: { enabled: false } }),
    ).toBeUndefined();
  });
});
