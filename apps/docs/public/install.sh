#!/bin/sh
# superlore CLI installer.
#
#   curl -fsSL https://superlore.vercel.app/install.sh | sh
#
# Installs the `superlore` command globally with your Node package manager (pnpm, bun, or npm).
# superlore is a Node CLI — no separate binary to download; the bytes come straight from the npm
# registry. Re-run any time to upgrade to the latest version.
#
# Env overrides:
#   SUPERLORE_PM       force a package manager: npm | pnpm | bun | yarn
#   SUPERLORE_CLI_PKG  the package to install (default superlore-cli)
set -eu

PKG="${SUPERLORE_CLI_PKG:-superlore-cli}"

# Brand colours — superlore violet (#6D5CF0) + the half-tone face (#b7acff), via truecolor.
V='\033[38;2;109;92;240m'
S='\033[38;2;183;172;255m'
B='\033[1m'
D='\033[2m'
Y='\033[33m'
R='\033[31m'
Z='\033[0m'

say() { printf "${V}›${Z} %s\n" "$1"; }
warn() { printf "${Y}! %s${Z}\n" "$1" >&2; }
err() {
  printf "${R}✗ %s${Z}\n" "$1" >&2
  exit 1
}

# The Fold mark — the lit human face and the half-tone machine face — beside the wordmark.
printf "\n  ${V}██${Z}${S}▓▓${Z}\n"
printf "  ${V}██${Z}${S}▓▓${Z}   ${B}${V}superlore${Z}\n"
printf "  ${V}██${Z}${S}▓▓${Z}   ${D}the company knowledge base your agents run on${Z}\n"
printf "  ${V}██${Z}${S}▓▓${Z}\n\n"

command -v node >/dev/null 2>&1 ||
  err "Node.js (>= 20) is required. Install it from https://nodejs.org then re-run."

major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${major:-0}" -lt 20 ] 2>/dev/null; then
  warn "Node ${major} detected; superlore needs Node >= 20. The CLI may not run correctly."
fi

# Pick a package manager: explicit override, else the first one available.
pm="${SUPERLORE_PM:-}"
if [ -z "$pm" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    pm="pnpm"
  elif command -v bun >/dev/null 2>&1; then
    pm="bun"
  elif command -v npm >/dev/null 2>&1; then
    pm="npm"
  else
    err "No supported package manager found. Install npm (ships with Node), pnpm, or bun."
  fi
fi

# Install with a given manager. Returns its exit code (the global bin is the same either way).
install_with() {
  case "$1" in
    npm) npm install -g "$PKG" ;;
    pnpm) pnpm add -g "$PKG" ;;
    bun) bun add -g "$PKG" ;;
    yarn) yarn global add "$PKG" ;;
    *) return 99 ;;
  esac
}

say "Installing ${PKG} globally with ${pm}…"
if ! install_with "$pm"; then
  # pnpm/bun often fail the first time because their global bin dir isn't set up yet
  # (ERR_PNPM_NO_GLOBAL_BIN_DIR). npm always has one, and the installed binary is identical,
  # so fall back to npm rather than make the user run `pnpm setup` and start over.
  if [ "$pm" != "npm" ] && command -v npm >/dev/null 2>&1; then
    warn "${pm} global install failed — falling back to npm (the 'superlore' binary is the same)."
    install_with npm || err "Install failed with both ${pm} and npm."
  else
    err "Install failed. With pnpm, run ${pm} setup once (to create the global bin dir), then re-run."
  fi
fi

if ! command -v superlore >/dev/null 2>&1; then
  warn "Installed, but 'superlore' isn't on your PATH yet. Open a new shell, or add your package"
  warn "manager's global bin directory to PATH (e.g. \$(${pm} bin -g) or ~/.local/bin)."
fi

say "Done. Scaffold your first knowledge base:"
printf "    ${B}superlore init my-kb${Z}   ${D}— scaffolds the KB and sets up your editor${Z}\n\n"
printf "${D}Already set up? ${Z}${B}superlore connect${Z}${D} installs the live-preview extension into${Z}\n"
printf "${D}VS Code · Cursor · Windsurf. Or just ask Claude: \"Make me a docs site using superlore.\"${Z}\n"
printf "${D}Docs: https://superlore.vercel.app/docs${Z}\n"
