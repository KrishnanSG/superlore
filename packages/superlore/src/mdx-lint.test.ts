import { describe, expect, it } from "vitest";
import { findMdxProblems } from "./mdx-lint";

describe("findMdxProblems", () => {
  it("flags a bare identifier in prose braces (the crash class)", () => {
    expect(findMdxProblems("### GET /users/{id}")).toHaveLength(1);
    expect(findMdxProblems("the {group_id} token")[0]).toMatch(/undefined value/);
  });

  it("flags a template var", () => {
    expect(findMdxProblems("${HOME}/bin").length).toBeGreaterThan(0);
  });

  it("passes safe forms", () => {
    expect(findMdxProblems("### GET `/users/{id}`")).toEqual([]); // inline code
    expect(findMdxProblems("\\{group_id\\}")).toEqual([]); // escaped
    expect(findMdxProblems("count is {42}")).toEqual([]); // numeric literal
    expect(findMdxProblems('a {true} b {null} c {"x"}')).toEqual([]); // literals
    expect(findMdxProblems("text {/* a comment */} more")).toEqual([]); // mdx comment
  });

  it("ignores braces inside fenced code", () => {
    const mdx = ["```json", '{ "id": "{x}" }', "```"].join("\n");
    expect(findMdxProblems(mdx)).toEqual([]);
  });

  it("flags an unterminated brace and an unclosed fence", () => {
    expect(findMdxProblems("a {group_id")[0]).toMatch(/unterminated/);
    expect(findMdxProblems("```ts\nconst x = 1")[0]).toMatch(/unclosed code fence/);
  });
});
