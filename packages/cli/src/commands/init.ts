import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";

import { cancel, confirm, intro, isCancel, outro, select, text } from "@clack/prompts";

import {
  DEFAULT_MCP_PATH,
  type SuperloreAuthConfig,
  type SuperloreJson,
  type SuperloreType,
  validateSuperloreJson,
} from "../config.js";
import { SUPERLORE_VIOLET } from "../lib/constants.js";
import { accent, banner, bold, cyan, dim, log } from "../lib/log.js";
import { isEmptyDir, scaffold } from "../lib/scaffold.js";

/** CLI flags accepted by `superlore init`. */
export interface InitFlags {
  name?: string;
  type?: string;
  /** Enable the auth gate. Boolean flag (`--auth`) or `--no-auth`. */
  auth?: boolean;
  /** Restrict SSO to a single domain. Implies auth enabled. */
  allowedDomain?: string;
  /** Brand accent colour. */
  accent?: string;
  /** Disable the MCP endpoint (it is on by default). */
  mcp?: boolean;
  /** Skip interactive prompts; fail if required answers are missing. */
  yes?: boolean;
}

function bail(message: string): never {
  cancel(message);
  process.exit(1);
}

/**
 * `superlore init [dir]` — scaffold a new superlore KB.
 *
 * Resolves answers from flags first, falling back to interactive prompts (unless `--yes`). Writes
 * a validated `superlore.json`, copies the starter template (or a minimal skeleton), and prints the
 * next steps. Warns when a company KB ships without an auth gate.
 */
export async function initCommand(dir: string | undefined, flags: InitFlags): Promise<void> {
  banner();
  intro(`${accent("superlore")} ${dim("init")}`);

  const interactive = !flags.yes && process.stdout.isTTY;

  // 1. Name — explicit --name wins; else fall back to the [dir] argument; else prompt.
  let name = flags.name?.trim() || dir?.trim();
  if (!name && interactive) {
    const answer = await text({
      message: "What's your knowledge base called?",
      placeholder: "Acme Knowledge Base",
      validate: (v) => ((v ?? "").trim().length === 0 ? "A name is required." : undefined),
    });
    if (isCancel(answer)) bail("Cancelled.");
    name = answer.trim();
  }
  if (!name) bail("A name is required (pass --name, a [dir] argument, or run interactively).");

  // 2. Type
  let type = flags.type as SuperloreType | undefined;
  if (type && type !== "company-kb" && type !== "product-docs") {
    bail(`Invalid --type "${type}". Use "company-kb" or "product-docs".`);
  }
  if (!type && interactive) {
    const answer = await select({
      message: "What kind of KB is this?",
      options: [
        {
          value: "company-kb" as const,
          label: "Company KB",
          hint: "internal / private — should be gated",
        },
        {
          value: "product-docs" as const,
          label: "Product docs",
          hint: "public-facing documentation",
        },
      ],
    });
    if (isCancel(answer)) bail("Cancelled.");
    type = answer;
  }
  if (!type) bail("A type is required (pass --type or run interactively).");

  // 3. Auth — default ON for company-kb, OFF for product-docs.
  let authEnabled: boolean;
  if (flags.auth !== undefined) {
    authEnabled = flags.auth;
  } else if (flags.allowedDomain) {
    authEnabled = true;
  } else if (interactive) {
    const answer = await confirm({
      message: "Gate the site behind Google SSO (auth)?",
      initialValue: type === "company-kb",
    });
    if (isCancel(answer)) bail("Cancelled.");
    authEnabled = answer;
  } else {
    authEnabled = type === "company-kb";
  }

  let allowedDomain = flags.allowedDomain?.trim();
  if (authEnabled && !allowedDomain && interactive) {
    const answer = await text({
      message: "Restrict sign-in to an email domain? (optional)",
      placeholder: "acme.com — leave blank for any Google account",
    });
    if (isCancel(answer)) bail("Cancelled.");
    allowedDomain = answer.trim() || undefined;
  }

  // 4. Accent (optional)
  const accentColor = flags.accent?.trim();

  // 5. MCP — on by default.
  const mcpEnabled = flags.mcp ?? true;

  // Build & validate the config (validation applies defaults: mcp.path, auth.provider).
  const auth: SuperloreAuthConfig | undefined = authEnabled
    ? { enabled: true, provider: "google", ...(allowedDomain ? { allowedDomain } : {}) }
    : undefined;

  const draft: Record<string, unknown> = { name, type };
  if (accentColor) draft.accent = accentColor;
  if (auth) draft.auth = auth;
  draft.mcp = { enabled: mcpEnabled, ...(mcpEnabled ? { path: DEFAULT_MCP_PATH } : {}) };

  const result = validateSuperloreJson(draft);
  if (!result.ok) {
    bail(
      `Could not build a valid superlore.json:\n${result.issues.map((i) => `  - ${i.path} ${i.message}`).join("\n")}`,
    );
  }
  const config: SuperloreJson = result.value;

  // Resolve the target directory: explicit [dir], else a slug of the name, else a safe default.
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const targetName = dir ?? (slug || "superlore-kb");
  const targetDir = resolve(process.cwd(), targetName);

  if (existsSync(targetDir) && !isEmptyDir(targetDir)) {
    if (interactive) {
      const proceed = await confirm({
        message: `${cyan(targetDir)} is not empty. Scaffold into it anyway?`,
        initialValue: false,
      });
      if (isCancel(proceed) || !proceed) bail("Cancelled — pick an empty directory.");
    } else {
      bail(`${targetDir} is not empty. Pick an empty directory.`);
    }
  }

  const { root, source } = scaffold({ dir: targetDir, config });

  outro(`${bold("Scaffolded")} ${config.name} ${dim(`(${source})`)}`);

  // The company-KB-without-auth warning — print loudly before next steps.
  if (config.type === "company-kb" && !config.auth?.enabled) {
    log.blank();
    log.warn(
      `This is a ${bold("company KB")} but auth is ${bold("not enabled")}. A company KB should gate access before you deploy — re-run with ${cyan("--auth")} or set ${cyan('"auth": { "enabled": true }')} in superlore.json.`,
    );
  }

  printNextSteps(root, config);
}

function printNextSteps(root: string, config: SuperloreJson): void {
  const rel = basename(root);
  const accentNote = config.accent ?? SUPERLORE_VIOLET;
  log.blank();
  log.info(bold("Next steps"));
  log.info(`  ${accent("1.")} ${cyan(`cd ${rel}`)}`);
  log.info(`  ${accent("2.")} ${cyan("pnpm install")} ${dim("(or npm / yarn / bun)")}`);
  log.info(`  ${accent("3.")} ${cyan("superlore dev")} ${dim("— preview the site locally")}`);
  log.blank();
  log.info(`${dim("Config:")} ${cyan("superlore.json")}   ${dim("Brand accent:")} ${accentNote}`);
  if (config.mcp?.enabled) {
    log.info(`${dim("MCP endpoint:")} ${config.mcp.path ?? DEFAULT_MCP_PATH}`);
  }
}
