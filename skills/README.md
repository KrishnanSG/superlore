# superlore skills (Claude plugin)

Agent skills shipped with superlore so anyone can run the whole KB lifecycle through their agent —
**without** knowing how superlore works. These skills are bundled into a **Claude plugin** rooted at
the repo: the manifest at [`../.claude-plugin/plugin.json`](../.claude-plugin/plugin.json) lists every
skill below, and the [`../.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)
alongside it (plugin `source: "."`) makes it installable. Add the plugin and _"Make me a docs using
superlore"_ just works.

## The skills

- **[superlore-scaffold](superlore-scaffold/SKILL.md)** — the **entry** skill. Greets the user, asks the
  two questions that matter via **AskUserQuestion** (Company KB vs Product Documentation; auth vs
  public), then runs the `superlore` CLI to scaffold, writes `superlore.json`, seeds starter content, and
  narrates each step. Hard rule: a **company KB without auth** triggers a clear warning + an offer to
  add Google SSO. Triggers on _"make me a docs using superlore"_, "scaffold / set up a new KB".
- **[superlore-author](superlore-author/SKILL.md)** — author / "vibe" content into an existing KB. Turns
  intent into well-structured MDX with dual-representation components (cards, timelines, boards,
  entity cards, tables, a Canvas) — humans get a page, agents get a typed knowledge face from one
  source. Hands visual/diagram work to **superlore-canvas**. Triggers on "add a page / document X /
  make a roadmap".
- **[superlore-deploy](superlore-deploy/SKILL.md)** — get a KB live. **superlore Cloud is waitlisted**
  (private beta) — guides the user to the waitlist, and gives the full self-host / Vercel manual
  path so they ship today. Re-checks the company-KB-without-auth case before going public. Triggers
  on "deploy / publish / host my docs".
- **[superlore-connect-mcp](superlore-connect-mcp/SKILL.md)** — register the KB's MCP with the user's
  Claude at the **user** level (`claude mcp add … -s user`, or the client's `mcp.json`). **Asks
  permission** before touching any config and **asks** for the URL / a credential / a permission
  rather than guessing. Triggers on "connect / hook up my agent to the KB".
- **[superlore-canvas](superlore-canvas/SKILL.md)** — author rich superlore Canvas diagrams (architecture
  maps, brainstorms, flows, decision trees) as a typed knowledge graph that renders FigJam-grade.
  Triggers on "visualize / draw / diagram / whiteboard this".
- **[superlore-migrate](superlore-migrate/SKILL.md)** — migrate existing docs (Mintlify, Docusaurus,
  Fumadocs, Nextra, GitBook, plain `.md` — any framework) into superlore: a plan-first flow (a
  superlore doc you review + comment on), then convert with dual-rep components, verify the build +
  key pages with Playwright, and a summary doc with screenshots. Triggers on "migrate / port / convert
  my docs to superlore".

## Install the plugin into Claude

The skills are packaged as one Claude plugin named `superlore`, served from a marketplace also named
`superlore`. From inside Claude:

```bash
# 1. Add the marketplace (from the public repo)
/plugin marketplace add KrishnanSG/superlore

# 2. Install the plugin
/plugin install superlore@superlore
```

Then open a fresh session and say **"Make me a docs using superlore"** — the `superlore-scaffold` skill
takes it from there.

**Local / development install** (from a clone of this repo):

```bash
# point the marketplace at your local checkout (the repo root holds .claude-plugin/)
/plugin marketplace add /absolute/path/to/superlore
/plugin install superlore@superlore

# or test the plugin directly without installing (plugin root = repo root)
claude --plugin-dir /absolute/path/to/superlore
```

Validate the plugin before publishing — from the repo root — with `claude plugin validate .`.

## Layout

```
superlore/                      # the "superlore" plugin root (source: ".")
├── .claude-plugin/
│   ├── marketplace.json        # the "superlore" marketplace (plugin source → ".")
│   └── plugin.json             # the plugin manifest (bundles every skill below)
└── skills/                     # the bundled skills, auto-discovered as /superlore:<skill>
    ├── superlore-scaffold/SKILL.md
    ├── superlore-author/SKILL.md
    ├── superlore-deploy/SKILL.md
    ├── superlore-connect-mcp/SKILL.md
    ├── superlore-canvas/SKILL.md
    └── superlore-migrate/SKILL.md
```

Each skill is its own folder with a `SKILL.md` in the established format (YAML frontmatter:
`name`, `description`, `metadata.author`, `metadata.version`).
