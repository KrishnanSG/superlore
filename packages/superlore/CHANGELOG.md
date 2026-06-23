# superlore

## 0.11.1

### Patch Changes

- 996c6ce: Code blocks now keep their tokyo-night midnight background even when the host strips Shiki's inline CSS variables. The always-dark rule depended on `--shiki-dark-bg` / `--shiki-dark`; some hosts (notably a VS Code/Cursor webview) drop those inline custom properties, leaving the code block with the grey wrapper background instead of the midnight surface. Each `var()` now carries a literal tokyo-night fallback (`#1a1b26` / `#c0caf5`), so code renders on the midnight surface everywhere.

## 0.11.0

### Minor Changes

- 3ba478d: `SuperloreDoc` now stamps a small, floating "Powered by superlore" badge in the doc's bottom-right corner (links to the superlore site) — subtle branding on every embedded/runtime-rendered doc. It's on by default and opt-out per doc with `badge={false}`. The badge is anchored to the doc surface (not the host viewport), so it never overlaps a host app's chrome. `BuiltWithSuperlore` gained a `label` prop (defaults to "Built with"; the embed badge uses "Powered by").

## 0.10.0

### Minor Changes

- 5ee7110: Embeddable, container-scoped `superlore/runtime.css` — drop a doc into any host app with zero global leakage.

  `superlore/runtime.css` is now fully scoped to a `.superlore-doc` container: every selector is rooted at the container (tokens, preflight, and all utility/component rules), so importing it **app-wide** changes nothing outside a superlore doc — no reset of the host's `*`/`html`/`body`, no `:root` token collisions (e.g. `--font-sans`/`--font-mono`), no utility clashes. A host with no isolated doc route can finally import it once and ship.

  - **Dark mode is container-local.** It rides `data-theme="dark"` on the `.superlore-doc` element, not a `.dark` class on `<html>`. A doc can render dark while the app is light, and two docs can show different themes on one page.
  - **`SuperloreDoc` gains `tokens` and `theme` props.** Brand a doc and pick light/dark inline: `<SuperloreDoc source={mdx} theme="dark" tokens={{ accent: "var(--brand)" }} />`. Tokens are applied on the `.superlore-doc` element itself (so they win over the scoped per-container defaults). `SuperloreTheme` now flows `tokens`/`theme` to nested docs via context, and also gained a `theme` prop — wrapping still works.
  - **`SuperloreDoc` renders the `.superlore-doc` wrapper for you** — don't add your own. With the lower-level `useSuperloreMdx`/`compileMdxSource` API, wrap the rendered `Content` in a `.superlore-doc` element yourself.

  The container class (`.superlore-doc`) and dark attribute (`data-theme="dark"`) are the public contract. The build asserts the shipped CSS has no global root/element/preflight selectors, and the scoping is covered by unit tests.
