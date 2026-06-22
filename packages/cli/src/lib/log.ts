/**
 * Tiny ANSI logger. No dependency, no emoji (repo convention: hierarchy via type, not icons).
 * Colour is suppressed when stdout is not a TTY or NO_COLOR is set, so piped/CI output stays clean.
 *
 * Brand colour is the superlore violet (#6D5CF0) — emitted as exact 24-bit truecolor when the terminal
 * advertises it (COLORTERM), with a 256-colour fallback so it still reads violet anywhere.
 */

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const truecolor = useColor && /truecolor|24bit/i.test(process.env.COLORTERM ?? "");

function paint(open: string, text: string): string {
  return useColor ? `${open}${text}\x1b[0m` : text;
}

/** superlore violet (#6D5CF0) — the lit face of the mark. Truecolor, 256-colour fallback. */
export const accent = (text: string): string =>
  paint(truecolor ? "\x1b[38;2;109;92;240m" : "\x1b[38;5;99m", text);
/** The fold's half-tone face — a lighter violet (#b7acff). */
export const accentSoft = (text: string): string =>
  paint(truecolor ? "\x1b[38;2;183;172;255m" : "\x1b[38;5;147m", text);
export const bold = (text: string): string => paint("\x1b[1m", text);
export const dim = (text: string): string => paint("\x1b[2m", text);
export const green = (text: string): string => paint("\x1b[32m", text);
export const yellow = (text: string): string => paint("\x1b[33m", text);
export const red = (text: string): string => paint("\x1b[31m", text);
export const cyan = (text: string): string => paint("\x1b[36m", text);

/** The wordmark — bold + brand violet in one sequence (nesting colour + bold would reset early). */
const wordmark = (text: string): string =>
  paint(truecolor ? "\x1b[1m\x1b[38;2;109;92;240m" : "\x1b[1m\x1b[38;5;99m", text);

/**
 * The superlore banner: the Fold mark in two violet tones — the lit human face and the half-tone
 * machine face, the brand's whole idea — beside the wordmark and tagline. Degrades to a single
 * plain line when colour is off (NO_COLOR / non-TTY) so it never leaks block glyphs into a pipe.
 */
export function banner(): void {
  if (!useColor) {
    process.stdout.write("superlore — the company knowledge base your agents run on.\n");
    return;
  }
  // The Fold mark: the lit (human) face on the left and the half-tone (machine) face on the right,
  // meeting at the center crease, peaked top and bottom — mirrors brand/superlore-mark.svg.
  // Two clean violet tones — the lit (human) face and the lighter machine face — meeting at the
  // crease, rounded top and bottom. Solid blocks, no shade texture (that read as a checker grid).
  const seam = dim("▏");
  const lines = [
    `  ${accent("▗▄")}${seam}${accentSoft("▄▖")}`,
    `  ${accent("██")}${seam}${accentSoft("██")}   ${wordmark("superlore")}`,
    `  ${accent("██")}${seam}${accentSoft("██")}   ${dim("the company knowledge base your agents run on")}`,
    `  ${accent("▝▀")}${seam}${accentSoft("▀▘")}`,
  ];
  process.stdout.write(`\n${lines.join("\n")}\n\n`);
}

export const log = {
  info(message: string): void {
    process.stdout.write(`${message}\n`);
  },
  step(message: string): void {
    process.stdout.write(`${accent("›")} ${message}\n`);
  },
  success(message: string): void {
    process.stdout.write(`${green("✓")} ${message}\n`);
  },
  warn(message: string): void {
    process.stderr.write(`${yellow("!")} ${message}\n`);
  },
  error(message: string): void {
    process.stderr.write(`${red("✗")} ${message}\n`);
  },
  blank(): void {
    process.stdout.write("\n");
  },
};
