/**
 * The canonical `superlore.json` schema — owned by the CLI, importable everywhere.
 *
 * `superlore.json` lives at a superlore project's root and is the single source of truth for what a
 * KB *is*: its name, whether it's a private company KB or public product docs, its brand accent,
 * and how the human gate (auth) and the agent surface (MCP) are configured. The scaffolder writes
 * it; `superlore dev`/`build`/`deploy` read it; skills and other packages import {@link SuperloreJson}
 * to stay in lockstep with the contract.
 *
 * Validation is hand-rolled (no schema dependency) so this module is dependency-free and can be
 * imported from anywhere — including the browser or an edge runtime — without dragging in a
 * validator. Keep it that way.
 */

/**
 * The kinds of superlore KB. Drives defaults — the auth warning for company KBs, and an
 * auth-ON-by-default, MCP-ON private posture for a `personal-kb` (a digital replica of how one
 * person thinks, works, and writes).
 */
export type SuperloreType = "company-kb" | "product-docs" | "personal-kb";

/** Supported SSO providers. Only Google ships today (Auth.js v5 + Google SSO). */
export type SuperloreAuthProvider = "google";

/** The human gate. Optional and per-deploy — public by default. */
export interface SuperloreAuthConfig {
  /** When true, the site (and, by inheritance, the MCP) is gated. */
  enabled: boolean;
  /** SSO provider for the gate. Defaults to "google" when auth is enabled. */
  provider?: SuperloreAuthProvider;
  /** Restrict sign-in to a single email domain, e.g. "acme.com". */
  allowedDomain?: string;
}

/** The agent surface. Enabled by default; served at {@link DEFAULT_MCP_PATH}. */
export interface SuperloreMcpConfig {
  /** When true, the KB exposes an MCP endpoint over its structured index. */
  enabled: boolean;
  /** Route the MCP is served at. Defaults to {@link DEFAULT_MCP_PATH}. */
  path?: string;
}

/** A navbar logo — light/dark image paths + an optional home link, the mint.json way. */
export interface SuperloreLogo {
  light?: string;
  dark?: string;
  href?: string;
}

/** The parsed, validated shape of a `superlore.json` file. */
export interface SuperloreJson {
  /** Human-facing KB name. */
  name: string;
  /** Whether this is a private company KB, public product docs, or a private personal KB. */
  type: SuperloreType;
  /** Brand accent — any CSS colour. superlore derives the rest of the family (light + dark). */
  accent?: string;
  /** Visual theme skin: "default" | "mint" (loose — forward-compatible with future skins). */
  theme?: string;
  /** Navbar logo — light/dark images + home link (mint.json-style). */
  logo?: SuperloreLogo;
  /** Favicon path (svg / png / ico). */
  favicon?: string;
  /** The human gate. Omitted ⇒ public. */
  auth?: SuperloreAuthConfig;
  /** The agent surface. Omitted ⇒ MCP enabled at the default path. */
  mcp?: SuperloreMcpConfig;
}

/** The default MCP route, matching the reference deploy (`apps/docs`). */
export const DEFAULT_MCP_PATH = "/api/mcp";

/** The canonical config filename written at a project root. */
export const SUPERLORE_JSON_FILENAME = "superlore.json";

/** Every valid {@link SuperloreType}, for prompts and validation. */
export const SUPERLORE_TYPES: readonly SuperloreType[] = [
  "company-kb",
  "product-docs",
  "personal-kb",
];

/** A validation failure, with the dotted path to the offending field. */
export interface SuperloreJsonIssue {
  /** Dotted field path, e.g. "auth.provider". */
  path: string;
  /** Human-readable problem. */
  message: string;
}

/** Result of {@link validateSuperloreJson} / {@link parseSuperloreJson}. */
export type SuperloreJsonResult =
  | { ok: true; value: SuperloreJson }
  | { ok: false; issues: SuperloreJsonIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate an already-parsed value against the `superlore.json` contract, applying defaults.
 *
 * Defaults applied on success: when `mcp` is present and enabled but has no `path`, it is set to
 * {@link DEFAULT_MCP_PATH}; when `auth` is present and enabled but has no `provider`, it is set to
 * "google". Returns a discriminated result rather than throwing, so callers can render every issue.
 */
export function validateSuperloreJson(input: unknown): SuperloreJsonResult {
  const issues: SuperloreJsonIssue[] = [];

  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: "", message: "must be a JSON object" }] };
  }

  // name
  const name = input.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    issues.push({ path: "name", message: "is required and must be a non-empty string" });
  }

  // type
  const type = input.type;
  if (typeof type !== "string" || !SUPERLORE_TYPES.includes(type as SuperloreType)) {
    issues.push({
      path: "type",
      message: `is required and must be one of ${SUPERLORE_TYPES.map((t) => `"${t}"`).join(" | ")}`,
    });
  }

  // accent (optional)
  const accent = input.accent;
  if (accent !== undefined && (typeof accent !== "string" || accent.trim().length === 0)) {
    issues.push({ path: "accent", message: "must be a non-empty string (a CSS colour)" });
  }

  // theme (optional)
  const theme = input.theme;
  if (theme !== undefined && (typeof theme !== "string" || theme.trim().length === 0)) {
    issues.push({ path: "theme", message: "must be a non-empty string" });
  }

  // favicon (optional)
  const favicon = input.favicon;
  if (favicon !== undefined && (typeof favicon !== "string" || favicon.trim().length === 0)) {
    issues.push({ path: "favicon", message: "must be a non-empty string (a path or URL)" });
  }

  // logo (optional)
  let logo: SuperloreLogo | undefined;
  if (input.logo !== undefined) {
    if (!isRecord(input.logo)) {
      issues.push({ path: "logo", message: "must be an object" });
    } else {
      const l = input.logo;
      for (const k of ["light", "dark", "href"] as const) {
        if (
          l[k] !== undefined &&
          (typeof l[k] !== "string" || (l[k] as string).trim().length === 0)
        ) {
          issues.push({ path: `logo.${k}`, message: "must be a non-empty string" });
        }
      }
      logo = {
        light: typeof l.light === "string" ? l.light : undefined,
        dark: typeof l.dark === "string" ? l.dark : undefined,
        href: typeof l.href === "string" ? l.href : undefined,
      };
    }
  }

  // auth (optional)
  let auth: SuperloreAuthConfig | undefined;
  if (input.auth !== undefined) {
    if (!isRecord(input.auth)) {
      issues.push({ path: "auth", message: "must be an object" });
    } else {
      const a = input.auth;
      if (typeof a.enabled !== "boolean") {
        issues.push({ path: "auth.enabled", message: "is required and must be a boolean" });
      }
      if (a.provider !== undefined && a.provider !== "google") {
        issues.push({ path: "auth.provider", message: 'must be "google"' });
      }
      if (
        a.allowedDomain !== undefined &&
        (typeof a.allowedDomain !== "string" || a.allowedDomain.trim().length === 0)
      ) {
        issues.push({ path: "auth.allowedDomain", message: "must be a non-empty string" });
      }
      if (typeof a.enabled === "boolean") {
        auth = {
          enabled: a.enabled,
          // Default the provider to Google when the gate is on.
          provider:
            (a.provider as SuperloreAuthProvider | undefined) ?? (a.enabled ? "google" : undefined),
          allowedDomain: typeof a.allowedDomain === "string" ? a.allowedDomain : undefined,
        };
      }
    }
  }

  // mcp (optional)
  let mcp: SuperloreMcpConfig | undefined;
  if (input.mcp !== undefined) {
    if (!isRecord(input.mcp)) {
      issues.push({ path: "mcp", message: "must be an object" });
    } else {
      const m = input.mcp;
      if (typeof m.enabled !== "boolean") {
        issues.push({ path: "mcp.enabled", message: "is required and must be a boolean" });
      }
      if (m.path !== undefined && (typeof m.path !== "string" || !m.path.startsWith("/"))) {
        issues.push({ path: "mcp.path", message: 'must be a string starting with "/"' });
      }
      if (typeof m.enabled === "boolean") {
        mcp = {
          enabled: m.enabled,
          path: typeof m.path === "string" ? m.path : m.enabled ? DEFAULT_MCP_PATH : undefined,
        };
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const value: SuperloreJson = {
    name: (name as string).trim(),
    type: type as SuperloreType,
  };
  if (typeof accent === "string") value.accent = accent.trim();
  if (typeof theme === "string") value.theme = theme.trim();
  if (typeof favicon === "string") value.favicon = favicon.trim();
  if (logo && (logo.light || logo.dark || logo.href)) value.logo = logo;
  if (auth) value.auth = auth;
  if (mcp) value.mcp = mcp;

  return { ok: true, value };
}

/** Parse a `superlore.json` string and validate it. Surfaces JSON syntax errors as an issue. */
export function parseSuperloreJson(raw: string): SuperloreJsonResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    return { ok: false, issues: [{ path: "", message: `not valid JSON: ${message}` }] };
  }
  return validateSuperloreJson(data);
}

/** Serialize a {@link SuperloreJson} to the canonical, pretty-printed file body (trailing newline). */
export function serializeSuperloreJson(config: SuperloreJson): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Resolve the MCP path for a config, falling back to the default when enabled and unset. */
export function resolveMcpPath(config: SuperloreJson): string | undefined {
  if (!config.mcp || !config.mcp.enabled) return undefined;
  return config.mcp.path ?? DEFAULT_MCP_PATH;
}
