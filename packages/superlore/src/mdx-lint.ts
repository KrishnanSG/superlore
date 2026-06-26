/**
 * `superlore/mdx-lint` — a dependency-free check for the MDX patterns that compile clean but throw
 * at RENDER time, so an authoring skill (or a host's save path) can catch them before persisting.
 *
 * The mainline hazard: in MDX an unescaped `{` opens a JS expression, so prose like
 * `GET /users/{id}` becomes `{id}` — a reference to an undefined identifier that throws
 * `ReferenceError: id is not defined` when the doc renders (not when it compiles). API paths are the
 * worst case. This module flags that class (plus unterminated `{` and unclosed code fences) and
 * leaves real literals (`{42}`, `{true}`, `{"x"}`) and anything inside code spans/fences alone.
 *
 * Pure string scanning — no remark/unified, no React — so it imports anywhere (browser, edge, a
 * Python-twin's Node sibling). Heuristic, not a compiler: it catches the undefined-identifier-in-`{}`
 * class precisely, which is exactly the gap a compile step cannot see.
 */

/** Replace inline code spans (`` `…` ``, ``` ``…`` ```) with spaces — braces inside them are literal. */
function stripInlineCode(line: string): string {
  return line.replace(/(`+)(?:(?!\1).)*\1/g, (m) => " ".repeat(m.length));
}

/** Does a `{ … }` body reference a name that won't exist at render (vs a harmless literal)? */
function referencesUndefined(inner: string): boolean {
  const stripped = inner
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments — {/* … */} is a no-op expression
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, ""); // string literals
  const t = stripped.trim();
  if (t === "") return false; // {} , {" "} , {/* … */}
  if (/^(true|false|null|undefined)$/.test(t)) return false; // boolean / nullish literal
  if (/^[\d.\s,+\-*/()]*$/.test(t)) return false; // numeric expression
  return /[A-Za-z_$]/.test(stripped); // an identifier survived → an undefined reference at render
}

/**
 * Find render-breaking MDX problems. Returns human-readable messages (empty array = clean). Mirrors
 * the contract a host can reject a save on, or a skill can self-correct against before writing.
 */
export function findMdxProblems(mdx: string): string[] {
  const problems: string[] = [];
  const lines = mdx.split(/\r?\n/);
  let fence: string | null = null; // the ``` / ~~~ run that opened the current code block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const fenceMark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      // Close the block when a fence of the same char and at least the same length appears.
      if (fenceMark && fenceMark[0] === fence[0] && fenceMark.length >= fence.length) fence = null;
      continue; // inside a fenced block — braces are literal
    }
    if (fenceMark) {
      fence = fenceMark;
      continue;
    }

    const scan = stripInlineCode(line);
    for (let j = 0; j < scan.length; j++) {
      if (scan[j] !== "{" || scan[j - 1] === "\\") continue; // not an open, or escaped \{
      let depth = 1;
      let k = j + 1;
      for (; k < scan.length; k++) {
        if (scan[k] === "{" && scan[k - 1] !== "\\") depth++;
        else if (scan[k] === "}" && scan[k - 1] !== "\\" && --depth === 0) break;
      }
      if (depth !== 0) {
        problems.push(
          `line ${i + 1}: unterminated "{" — MDX reads it as a code expression that never closes. Wrap the text in backticks or escape the brace as \\{.`,
        );
        break;
      }
      const inner = scan.slice(j + 1, k);
      if (referencesUndefined(inner)) {
        const snippet = inner.trim().slice(0, 40);
        problems.push(
          `line ${i + 1}: "{${snippet}}" reads as a code expression that references an undefined value (it will crash at render). Wrap the text in backticks or escape the brace as \\{.`,
        );
      }
      j = k; // resume after the matched }
    }
  }

  if (fence) problems.push(`unclosed code fence opened with "${fence}".`);
  return problems;
}
