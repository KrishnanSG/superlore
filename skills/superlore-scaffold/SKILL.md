---
name: superlore-scaffold
description: Stand up a new superlore knowledge base end-to-end — the "Make me a docs using superlore" flow. Greets the user, asks the few core questions with AskUserQuestion (company KB vs product docs; auth-protected vs public), runs the `superlore` CLI to scaffold, writes `superlore.json`, configures the MCP, seeds starter content, and narrates every step. Use whenever someone asks to create / scaffold / set up / start a new superlore KB, wiki, docs site, or "knowledge base for my agents", or says "make me a docs using superlore".
metadata:
  author: superlore
  version: "1.0.0"
---

# Scaffolding a superlore knowledge base

This is the **entry skill**. A user opens their agent and says some version of _"make me a docs
using superlore"_ — this skill drives the entire setup: greet, ask the two questions that actually
matter, scaffold with the `superlore` CLI, write the config, seed starter content, and (optionally)
connect the MCP. **Narrate each step** so the user always knows what just happened and what's next.

You are setting up a **superlore** KB: author once in MDX, humans get a clean visual site, and agents
get a first-class **MCP** over the _same_ structured content. The user does **not** need to know how
superlore works — that's the whole point of this skill. Keep the conversation short and concrete.

## The golden flow — do these in order

1. **Greet + orient (1–2 lines).** Say what you're about to do and that you'll ask two quick
   questions, then do the rest. Don't dump architecture. Example:
   _"I'll set you up with a superlore knowledge base — author once, humans read a clean site and your
   agents read the same content over an MCP. Two quick questions and I'll scaffold it."_
2. **Confirm the target directory.** Where should the KB live? If the user named a project, use it;
   otherwise propose a sensible folder name and confirm. Don't scaffold into a non-empty directory
   without saying so.
3. **Ask the two core questions** — use the **AskUserQuestion** tool (see below). One call, two
   questions: (a) KB **type**, (b) **auth**.
4. **Apply the company-KB-without-auth rule** (see below) — this is non-negotiable.
5. **Scaffold** — run `superlore init` with the answers (see CLI contract), narrating it.
6. **Write / verify `superlore.json`** — the canonical config (schema below).
7. **Seed starter content** — a couple of dual-representation pages so the KB isn't empty.
8. **Set up the editor** — `superlore init` offers this itself (it detects VS Code / Cursor /
   Windsurf and installs the **superlore Preview** extension). If the user ran `init` non-interactively,
   mention they can run `superlore connect` to install the live-preview extension into their editor(s).
9. **Offer to connect the MCP** — hand off to **superlore-connect-mcp** (never edit the user's Claude
   config from this skill without their say-so).
10. **Tell them how to run it and what's next** — `superlore dev`, then author (**superlore-author**) and,
    when ready, deploy (**superlore-deploy**).

## The two questions (use AskUserQuestion)

Make **one** `AskUserQuestion` call with **both** questions so the user answers in one pass. Use
exactly these questions, options, and descriptions:

**Question 1 — `header: "KB type"`, `question: "What kind of knowledge base is this?"`**
(`multiSelect: false`)

| Option label            | Description                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `Company KB`            | An internal company knowledge base — teams + agents read your org's corpus. Maps to `type: company-kb`. |
| `Product Documentation` | Public product / developer docs for your users. Maps to `type: product-docs`.                           |

**Question 2 — `header: "Access"`, `question: "Who should be able to read it?"`**
(`multiSelect: false`)

| Option label     | Description                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `Auth-protected` | Gate the site **and** the MCP behind Google SSO (Auth.js). For internal / private knowledge. |
| `Public`         | Anyone can read the site and connect to the MCP. For open product docs.                      |

The AskUserQuestion tool always lets the user write a custom answer, so you don't need an "Other"
option — but do honour a custom answer (e.g. "public site but gated MCP" → set `auth.enabled` per
their intent and note it).

## The non-negotiable rule: Company KB + Public → WARN

If the user picks **Company KB** _and_ does **not** choose auth (picks Public, or declines auth),
you **must clearly warn** before scaffolding — a company knowledge base usually contains internal
information that should not be world-readable, and the MCP would expose that same content to any
agent that finds the URL. Say something like:

> ⚠️ Heads up: a **company knowledge base** is usually internal. Without auth, both the site **and**
> the MCP are public — anyone with the URL (human or agent) can read everything. I'd strongly
> recommend adding Google SSO before you deploy. Want me to set that up now?

Then **offer to enable auth** (flip `auth.enabled: true`, provider `google`). If they still choose
public after the warning, respect it — but record in `superlore.json` that it's intentional and remind
them again at deploy time (the **superlore-deploy** skill re-checks this). Never silently scaffold a
public company KB.

Product Documentation + Public needs no warning — that's the expected case.

## Run the scaffold (CLI contract)

superlore ships a `superlore` CLI. Scaffold with `init`, passing the answers as flags so it's
non-interactive (you've already asked):

```bash
superlore init <dir> \
  --type <company-kb|product-docs> \
  --auth <on|off> \
  [--provider google] \
  [--name "<KB name>"] \
  [--accent "#6D5CF0"]
```

- Prefer `npx superlore init …` (or `pnpm dlx superlore init …`) if `superlore` isn't installed globally, so
  the user doesn't need a global install.
- `superlore init` creates the project, installs deps, writes `superlore.json`, mounts the MCP route, and
  (when `--auth on`) wires the Auth.js + `proxy.ts` gate with self-disabling env defaults.
- **Narrate it**: "Scaffolding into `./my-kb` as a company KB with auth…" then report what landed.
- If the `superlore` CLI is not yet available in this environment, **say so plainly** and fall back to
  the manual wiring in the docs ([Getting started](https://github.com/KrishnanSG/superlore) →
  `apps/docs/content/docs/getting-started.mdx`): `npm i superlore`, import `superlore/css`, spread
  `getMDXComponents`, base the schema on `superloreFrontmatterSchema`, mount the MCP route. Do **not**
  pretend a command ran that didn't.

## Write `superlore.json` (the canonical config)

`superlore init` writes this; verify/repair it to match the user's answers. The CLI package owns the
schema — keep to it exactly:

```jsonc
{
  "name": "Acme Knowledge Base",
  "type": "company-kb", // "company-kb" | "product-docs"
  "accent": "#6D5CF0", // optional brand colour; omit for superlore violet
  "auth": {
    "enabled": true, // false for a public KB
    "provider": "google", // only when enabled
    "allowedDomain": "acme.com", // optional; restrict SSO to one workspace domain
  },
  "mcp": {
    "enabled": true,
    "path": "/api/mcp", // default
  },
}
```

- **`type`** comes straight from Question 1.
- **`auth.enabled`** comes from Question 2 (plus the company-KB rule). When enabling, set
  `provider: "google"` and **ask** for `allowedDomain` if it's a company KB — but make it optional
  (leave it out if they don't have one handy; any Google account can sign in without it).
- **`mcp.enabled`** defaults to `true` (the MCP is a first-class surface); `mcp.path` defaults to
  `/api/mcp`. Only disable the MCP if the user explicitly asks.
- Don't invent fields. If you need a setting that isn't in the schema, ask the user and note it —
  don't write it into `superlore.json`.

## Seed starter content

Leave the user with a KB that isn't empty. Create one or two **dual-representation** pages so they
see the point immediately — e.g. an index/overview page and a small `Timeline` or `KeyFacts` page.
For anything beyond a trivial seed, hand off to **superlore-author** rather than hand-rolling MDX here.
Keep the seed honest to the contract: author the _data_, not a picture.

## Connect the MCP

Once scaffolded, offer to register the KB's MCP with the user's agent so they can immediately query
their own corpus. **Hand off to superlore-connect-mcp** — that skill asks permission before touching
any Claude config and asks for the URL if it isn't known yet. Do not run `claude mcp add` from here.

## Wrap up — tell them what's next

End with a short, concrete next-steps list:

- **Run it:** `superlore dev` (or `npx superlore dev`) → open the local URL.
- **Preview in your editor:** `superlore connect` installs the superlore Preview extension into
  VS Code / Cursor / Windsurf (live preview of every component as you author). `init` already offers
  this; mention it if it was skipped.
- **Author:** "ask me to add pages, a canvas, or components" → triggers **superlore-author**.
- **Connect agents:** offer **superlore-connect-mcp** if you didn't already.
- **Deploy:** when ready, **superlore-deploy** (self-host on Vercel today; superlore Cloud is waitlisted).

## Remember

- Two questions, asked once, with **AskUserQuestion**. Don't interrogate.
- **Company KB + no auth ⇒ warn loudly and offer to fix it.** This is the one hard rule.
- Narrate each step; never claim a command ran if it didn't.
- The MCP is first-class — `mcp.enabled` stays on unless the user opts out.
