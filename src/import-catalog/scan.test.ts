import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { scanImportFolder } from "./scan";

describe("scanImportFolder", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "import-scan-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("covers AE4: detects gallery filename collision across JSON files", async () => {
    await fs.writeFile(
      path.join(tempDir, "a.json"),
      JSON.stringify({
        name: "A",
        email: "a@example.sk",
        portfolio: ["hero.jpg"],
      }),
    );
    await fs.writeFile(
      path.join(tempDir, "b.json"),
      JSON.stringify({
        name: "B",
        email: "b@example.sk",
        portfolio: ["hero.jpg"],
      }),
    );
    await fs.writeFile(path.join(tempDir, "hero.jpg"), "fake");

    const result = await scanImportFolder(tempDir);
    expect(result.collisionErrors.size).toBe(2);
    expect(result.collisionErrors.get("a.json")).toMatch(/hero\.jpg/i);
    expect(result.collisionErrors.get("b.json")).toMatch(/hero\.jpg/i);
  });

  it("lists json files in folder", async () => {
    await fs.writeFile(
      path.join(tempDir, "one.json"),
      JSON.stringify({ name: "One", email: "one@example.sk" }),
    );
    const result = await scanImportFolder(tempDir);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].fileName).toBe("one.json");
  });
});
