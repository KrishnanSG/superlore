import { describe, expect, it, vi } from "vitest";

import {
  type DetectedEditor,
  type Runner,
  classifyInstallOutput,
  EDITORS,
  EXTENSION_ID,
  installInto,
} from "./editors.js";

const vscode: DetectedEditor = {
  id: "vscode",
  label: "VS Code",
  bin: "code",
  command: "code",
};

describe("EDITORS", () => {
  it("targets VS Code, Cursor, and Windsurf in order", () => {
    expect(EDITORS.map((e) => e.id)).toEqual(["vscode", "cursor", "windsurf"]);
  });
});

describe("classifyInstallOutput", () => {
  it("reads VS Code's 'already installed' notice as already-installed", () => {
    const out = `Extension 'superlore.superlore-preview' v0.1.5 is already installed.`;
    expect(classifyInstallOutput(vscode, out).status).toBe("already-installed");
  });

  it("treats a confirmation line as a fresh install", () => {
    const out = `Installing extensions...\nExtension 'superlore.superlore-preview' v0.1.5 was successfully installed.`;
    expect(classifyInstallOutput(vscode, out).status).toBe("installed");
  });
});

describe("installInto", () => {
  it("drives the editor CLI with --install-extension <id> --force", () => {
    const run = vi.fn<Runner>().mockReturnValue("was successfully installed");
    const result = installInto(vscode, { run });

    expect(run).toHaveBeenCalledWith("code", ["--install-extension", EXTENSION_ID, "--force"]);
    expect(result.status).toBe("installed");
  });

  it("installs a local .vsix when given one", () => {
    const run = vi.fn<Runner>().mockReturnValue("was successfully installed");
    installInto(vscode, { run, vsix: "/tmp/superlore-preview.vsix" });

    expect(run).toHaveBeenCalledWith("code", [
      "--install-extension",
      "/tmp/superlore-preview.vsix",
      "--force",
    ]);
  });

  it("surfaces a thrown CLI error as a failed result rather than throwing", () => {
    const run = vi.fn<Runner>().mockImplementation(() => {
      throw new Error("command not found");
    });
    const result = installInto(vscode, { run });

    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.error).toContain("command not found");
  });
});
