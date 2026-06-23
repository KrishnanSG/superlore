/**
 * `superlore-cli` — the superlore CLI.
 *
 * This module is both the executable (`superlore`, via the `bin` entry) and the package's library
 * barrel. Importing `superlore-cli` re-exports the canonical `superlore.json` schema + loader so other
 * packages and skills can reuse the contract; running it as a binary parses argv and dispatches.
 *
 * The CLI body runs only when invoked as the program entrypoint (the shebang'd `dist/index.js`),
 * guarded so a plain `import` never triggers a process exit.
 */
import { fileURLToPath } from "node:url";
import process from "node:process";

import { cac } from "cac";

import { buildCommand } from "./commands/build.js";
import { connectCommand } from "./commands/connect.js";
import { deployCommand } from "./commands/deploy.js";
import { devCommand } from "./commands/dev.js";
import { initCommand } from "./commands/init.js";
import { banner, log } from "./lib/log.js";

// Re-export the canonical config contract for programmatic consumers.
export * from "./config.js";

/** The CLI version, kept in sync with package.json at build time. */
export const VERSION = "0.4.0";

/** Build the argument parser. Exported for tests; `run()` wires it to argv. */
export function buildCli(argv: readonly string[] = process.argv) {
  const cli = cac("superlore");

  cli
    .command("init [dir]", "Scaffold a new superlore knowledge base")
    .option("--name <name>", "KB name")
    .option("--type <type>", "KB type: company-kb | product-docs | personal-kb")
    .option("--auth", "Enable the Google SSO auth gate")
    .option("--no-auth", "Disable the auth gate")
    .option("--allowed-domain <domain>", "Restrict SSO to one email domain (implies --auth)")
    .option("--accent <color>", "Brand accent colour (any CSS colour)")
    .option("--no-mcp", "Disable the MCP endpoint (on by default)")
    .option("--connect", "Install the editor extension after scaffolding (skip the prompt)")
    .option("--no-connect", "Don't set up the editor extension")
    .option("-y, --yes", "Skip prompts; use flags + defaults")
    .example("superlore init my-kb --type product-docs")
    .example("superlore init acme --type company-kb --auth --allowed-domain acme.com")
    .example("superlore init me --type personal-kb")
    .action(
      async (
        dir: string | undefined,
        flags: {
          name?: string;
          type?: string;
          auth?: boolean;
          allowedDomain?: string;
          accent?: string;
          mcp?: boolean;
          connect?: boolean;
          yes?: boolean;
        },
      ) => {
        // cac registers `auth: true` by default whenever `--no-auth` exists, so flags.auth can't
        // distinguish "unset" from "explicitly enabled". Recover the user's intent from raw argv:
        // unset ⇒ undefined (let init apply the type-based default). Same for --connect/--no-connect.
        const authExplicit = argv.includes("--auth");
        const noAuthExplicit = argv.includes("--no-auth");
        const auth = authExplicit ? true : noAuthExplicit ? false : undefined;

        const connectExplicit = argv.includes("--connect");
        const noConnectExplicit = argv.includes("--no-connect");
        const connect = connectExplicit ? true : noConnectExplicit ? false : undefined;

        await initCommand(dir, {
          name: flags.name,
          type: flags.type,
          auth,
          allowedDomain: flags.allowedDomain,
          accent: flags.accent,
          // `--no-mcp` flips this to false; default true is the intended behaviour.
          mcp: flags.mcp,
          connect,
          yes: flags.yes,
        });
      },
    );

  cli
    .command("dev", "Run the local superlore site for preview")
    .option("--port <port>", "Port for the dev server", { default: 3000 })
    .action(async (flags: { port?: number }) => {
      await devCommand({ port: flags.port });
    });

  cli.command("build", "Production build of the KB").action(async () => {
    await buildCommand();
  });

  cli
    .command("connect", "Install the superlore editor extension (VS Code · Cursor · Windsurf)")
    .option("--vsix <path>", "Install from a local .vsix instead of the Marketplace")
    .example("superlore connect")
    .action(async (flags: { vsix?: string }) => {
      await connectCommand({ vsix: flags.vsix });
    });

  cli
    .command("deploy", "Managed deploy (superlore Cloud) — private beta, joins the waitlist")
    .option("--open", "Open the waitlist URL in your browser")
    .action(async (flags: { open?: boolean }) => {
      await deployCommand({ open: flags.open });
    });

  cli.help();
  cli.version(VERSION);

  return cli;
}

/** Parse argv and dispatch. Reports unknown commands and unexpected errors cleanly. */
export async function run(argv: readonly string[] = process.argv): Promise<void> {
  const cli = buildCli(argv);
  // Lead the root experience with the branded banner: bare `superlore` and top-level `superlore --help`
  // (but not `superlore <cmd> --help`, and not `--version`, which stays terse for scripts). Printed
  // before parse so it sits above cac's own help output for `--help`.
  const tokens = argv.slice(2);
  const hasCommand = tokens.some((t) => !t.startsWith("-"));
  const wantsVersion = tokens.includes("-v") || tokens.includes("--version");
  if (!hasCommand && !wantsVersion) banner();
  try {
    cli.parse([...argv], { run: false });
    // No matched command. For bare `superlore`, cac prints nothing, so show help ourselves; for
    // `superlore --help`, cac already printed it during parse, so don't double up.
    if (!cli.matchedCommand && !cli.options.version) {
      if (!cli.options.help) cli.outputHelp();
      return;
    }
    await cli.runMatchedCommand();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(message);
    process.exit(1);
  }
}

// Run only when executed as the program entrypoint, never on import.
const isEntrypoint = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntrypoint) {
  void run();
}
