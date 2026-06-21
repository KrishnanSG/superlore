# superlore CLI installer (Windows / PowerShell).
#
#   irm https://superlore.vercel.app/install.ps1 | iex
#
# Installs the `superlore` command globally with your Node package manager (pnpm, bun, or npm).
# Re-run any time to upgrade. Env overrides: $env:SUPERLORE_PM, $env:SUPERLORE_CLI_PKG.
$ErrorActionPreference = "Stop"

$pkg = if ($env:SUPERLORE_CLI_PKG) { $env:SUPERLORE_CLI_PKG } else { "superlore-cli" }
$violet = "$([char]27)[38;2;109;92;240m"
$soft = "$([char]27)[38;2;183;172;255m"
$dim = "$([char]27)[2m"
$bold = "$([char]27)[1m"
$z = "$([char]27)[0m"

Write-Host ""
Write-Host "  $violet##$z$soft$([char]0x2593)$([char]0x2593)$z"
Write-Host "  $violet##$z$soft$([char]0x2593)$([char]0x2593)$z   $bold${violet}superlore$z"
Write-Host "  $violet##$z$soft$([char]0x2593)$([char]0x2593)$z   ${dim}the company knowledge base your agents run on$z"
Write-Host "  $violet##$z$soft$([char]0x2593)$([char]0x2593)$z"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js (>= 20) is required. Install it from https://nodejs.org then re-run."
}

$pm = $env:SUPERLORE_PM
if (-not $pm) {
  if (Get-Command pnpm -ErrorAction SilentlyContinue) { $pm = "pnpm" }
  elseif (Get-Command bun -ErrorAction SilentlyContinue) { $pm = "bun" }
  elseif (Get-Command npm -ErrorAction SilentlyContinue) { $pm = "npm" }
  else { Write-Error "No supported package manager found. Install npm (ships with Node), pnpm, or bun." }
}

Write-Host "$violet>$z Installing $pkg globally with $pm..."
switch ($pm) {
  "npm" { npm install -g $pkg }
  "pnpm" { pnpm add -g $pkg }
  "bun" { bun add -g $pkg }
  "yarn" { yarn global add $pkg }
  default { Write-Error "Unknown package manager '$pm'." }
}

Write-Host "$violet>$z Done. Scaffold your first knowledge base:"
Write-Host "    ${bold}superlore init my-kb$z"
