---
name: superlore-deploy
description: Get a superlore knowledge base live. superlore Cloud (managed hosting, SSO, team features) is in private beta — this skill guides the user to the waitlist, and gives the full self-host / Vercel manual path so they can ship today for free. Use when someone asks to deploy, publish, host, or "put my superlore docs online", or runs into `superlore deploy`.
metadata:
  author: superlore
  version: "1.0.0"
---

# Deploying a superlore knowledge base

superlore is open source and **self-hosts free today**. Managed hosting — **superlore Cloud** — is in
**private beta** (waitlisted), so the one-command `superlore deploy` path is not generally available
yet. This skill does two things: (1) get the user on the **Cloud waitlist**, and (2) walk them
through **self-hosting on Vercel (or anywhere)** so they're live now. Deployment is always the
user's — superlore never hosts their data without their say-so.

## First: a pre-deploy safety check

Before deploying anything, re-check the auth posture — especially for a **company KB**:

- Read `superlore.json`. If `type: "company-kb"` and `auth.enabled` is `false`, **warn the user**: a
  public deploy makes the site **and** the MCP world-readable. Strongly recommend enabling Google
  SSO before going live, and offer to flip it on (`auth.enabled: true`, `provider: "google"`). Only
  proceed public if they reconfirm.
- Product docs that are intentionally public need no warning.

## superlore Cloud — the waitlist (managed path)

`superlore deploy` (one-command managed hosting with a hosted MCP endpoint, SSO/governance, and team
workspaces) is **in private beta**. Don't pretend it's live. Instead:

- Tell the user managed hosting is coming and point them at the **waitlist**:
  **https://superlore.vercel.app/cloud** (the in-repo waitlist page is `apps/docs/app/cloud/page.tsx`; on the
  public site it's `/cloud`).
- If they're keen, that's the action: join the waitlist for early access. Then steer them to
  self-host now so they're not blocked.

What Cloud will add (for context, no prices — it's not selling yet): managed hosting + one-click
updates with a hosted MCP endpoint, Google/SAML SSO + org gate + roles/audit, and shared team
workspaces over one MCP URL.

## Self-host on Vercel (ship today, free)

This is the real, working path. superlore is a standard **Next.js 16 + Fumadocs** app, so it deploys to
Vercel (or any Next host) like any Next app.

1. **Build locally first** to catch errors: `superlore build` (or `npm run build` / `pnpm build`).
   Narrate the result.
2. **Push to a Git repo** the user controls (GitHub/GitLab/Bitbucket).
3. **Import to Vercel** — New Project → import the repo → Vercel detects Next.js. No special build
   config needed for a default superlore app.
4. **Set environment variables** if auth is enabled (`auth.enabled: true` in `superlore.json`). These
   gate the site **and** the MCP via `proxy.ts`:

   | Variable              | Required   | Purpose                                                        |
   | --------------------- | ---------- | -------------------------------------------------------------- |
   | `AUTH_GOOGLE_ID`      | to enable  | Google OAuth client id — its **presence turns auth ON**        |
   | `AUTH_GOOGLE_SECRET`  | to enable  | Google OAuth client secret                                     |
   | `AUTH_SECRET`         | yes (auth) | Secret used to encrypt the session (JWT)                       |
   | `AUTH_URL`            | yes (auth) | The deploy's canonical URL                                     |
   | `AUTH_TRUST_HOST`     | yes (auth) | Set `true` behind a proxy / on Vercel                          |
   | `AUTH_ALLOWED_DOMAIN` | no         | Restrict SSO to one workspace domain, e.g. `acme.com`          |
   | `AUTH_ALLOWED_EMAILS` | no         | Comma-separated email allowlist that bypasses the domain check |

   With **no** `AUTH_GOOGLE_ID`, auth stays off and the deploy is fully public — that's the
   intended public path.

   **Never ask the user to paste secrets into the chat.** Tell them to add these in Vercel's project
   settings (Environment Variables) or via `vercel env add`. If a value is missing, **ask them to
   set it themselves** rather than guessing or inventing one.

5. **Deploy** — Vercel builds and gives a URL. The MCP comes up at `<deploy>/api/mcp` (or the
   `mcp.path` from `superlore.json`).
6. **Verify**: open the site; then connect the MCP and confirm `search` / `get_page` work — hand off
   to **superlore-connect-mcp**.

For non-Vercel hosts: it's a standard Next 16 app — `next build` then run/serve per the host's Next
guide. A static export works for a fully public KB with no server-side auth; the MCP route needs a
running server (or Cloud).

## Remember

- **Cloud is waitlisted** — guide to https://superlore.vercel.app/cloud; don't run a managed deploy that
  doesn't exist.
- **Self-host on Vercel works today** — that's the path to "live now".
- **Re-check the company-KB-without-auth case** before going public.
- **No secrets in chat.** If a credential/env var is missing, ask the user to set it themselves.
