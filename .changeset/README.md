# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets). Only the
published package — `superlore` — is versioned here; the private workspaces (`superlore-docs`,
`@superlore/starter`) are ignored.

When you change `packages/superlore` in a user-facing way, run `pnpm changeset`, pick a bump
(patch / minor / major), and write a one-line summary. CI turns accumulated changesets into a
version bump + changelog and publishes to npm via OIDC trusted publishing on `main`.
