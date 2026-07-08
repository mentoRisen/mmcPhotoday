import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { copyGalleryImages } from "./copy-images";

describe("copyGalleryImages", () => {
  let root: string;
  let importDir: string;
  let publicRoot: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "import-copy-"));
    importDir = path.join(root, "import");
    publicRoot = path.join(root, "public");
    await fs.mkdir(importDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("copies hero.jpg to namespaced public path", async () => {
    await fs.writeFile(path.join(importDir, "hero.jpg"), "image-data");
    const result = await copyGalleryImages({
      importDir,
      publicRoot,
      entityType: "photographers",
      slug: "test-slug",
      filenames: ["hero.jpg"],
    });
    expect(result.ok).toBe(true);
    const dest = path.join(
      publicRoot,
      "catalog",
      "photographers",
      "test-slug",
      "hero.jpg",
    );
    const content = await fs.readFile(dest, "utf8");
    expect(content).toBe("image-data");
  });

  it("overwrites on re-copy", async () => {
    await fs.writeFile(path.join(importDir, "hero.jpg"), "v2");
    const destDir = path.join(
      publicRoot,
      "catalog",
      "photographers",
      "test-slug",
    );
    await fs.mkdir(destDir, { recursive: true });
    await fs.writeFile(path.join(destDir, "hero.jpg"), "v1");

    const result = await copyGalleryImages({
      importDir,
      publicRoot,
      entityType: "photographers",
      slug: "test-slug",
      filenames: ["hero.jpg"],
    });
    expect(result.ok).toBe(true);
    const content = await fs.readFile(path.join(destDir, "hero.jpg"), "utf8");
    expect(content).toBe("v2");
  });

  it("returns error when source file is missing", async () => {
    const result = await copyGalleryImages({
      importDir,
      publicRoot,
      entityType: "locations",
      slug: "loc",
      filenames: ["missing.jpg"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/missing\.jpg/);
    }
  });
});
