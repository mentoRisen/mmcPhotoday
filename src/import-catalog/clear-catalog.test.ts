import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

vi.mock("@/db/catalog-clear", () => ({
  clearCatalogFromDb: vi.fn().mockResolvedValue({
    bookingsDeleted: 0,
    photographersDeleted: 1,
    locationsDeleted: 2,
  }),
}));

import {
  clearCatalogPublicDir,
  formatClearReport,
  runCatalogClear,
} from "./clear-catalog";

describe("clearCatalogPublicDir", () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "catalog-clear-"));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("removes public/catalog when present", async () => {
    const catalogDir = path.join(root, "catalog", "photographers", "anna");
    await fs.mkdir(catalogDir, { recursive: true });
    await fs.writeFile(path.join(catalogDir, "hero.jpg"), "image");

    const removed = await clearCatalogPublicDir(root);

    expect(removed).toBe(true);
    await expect(fs.access(path.join(root, "catalog"))).rejects.toThrow();
  });

  it("returns false when public/catalog is absent", async () => {
    const removed = await clearCatalogPublicDir(root);
    expect(removed).toBe(false);
  });
});

describe("runCatalogClear", () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "catalog-clear-run-"));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("clears database rows and public assets", async () => {
    const publicRoot = path.join(root, "public");
    await fs.mkdir(path.join(publicRoot, "catalog"), { recursive: true });

    const result = await runCatalogClear({ rootDir: root, publicRoot });

    expect(result).toEqual({
      bookingsDeleted: 0,
      photographersDeleted: 1,
      locationsDeleted: 2,
      catalogDirRemoved: true,
    });
  });
});

describe("formatClearReport", () => {
  it("summarizes deleted rows and filesystem cleanup", () => {
    const report = formatClearReport({
      bookingsDeleted: 1,
      photographersDeleted: 2,
      locationsDeleted: 3,
      catalogDirRemoved: true,
    });

    expect(report).toContain("Bookings deleted: 1");
    expect(report).toContain("Photographers deleted: 2");
    expect(report).toContain("Locations deleted: 3");
    expect(report).toContain("public/catalog removed: yes");
  });
});
