import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const upsertPhotographer = vi.fn();
const upsertLocation = vi.fn();

vi.mock("@/db/catalog-import", () => ({
  upsertPhotographer: (...args: unknown[]) => upsertPhotographer(...args),
  upsertLocation: (...args: unknown[]) => upsertLocation(...args),
}));

import { runCatalogImport } from "./run-import";
import { hasFailures } from "./report";

describe("runCatalogImport", () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "run-import-"));
    await fs.mkdir(path.join(root, "import", "photographers"), {
      recursive: true,
    });
    await fs.mkdir(path.join(root, "import", "locations"), {
      recursive: true,
    });
    await fs.mkdir(path.join(root, "public"), { recursive: true });
    upsertPhotographer.mockReset();
    upsertLocation.mockReset();
    upsertPhotographer.mockResolvedValue({ action: "created", id: 1 });
    upsertLocation.mockResolvedValue({ action: "created", id: 2 });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("covers AE1: imports valid photographer", async () => {
    const dir = path.join(root, "import", "photographers");
    await fs.writeFile(path.join(dir, "anna.json"), JSON.stringify({
      name: "Anna",
      email: "anna@example.sk",
      portfolio: ["hero.jpg"],
    }));
    await fs.writeFile(path.join(dir, "hero.jpg"), "img");

    const results = await runCatalogImport({
      rootDir: root,
      baseUrl: "http://localhost:3002",
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("created");
    expect(upsertPhotographer).toHaveBeenCalledOnce();
    expect(upsertPhotographer.mock.calls[0][0].portfolioUrls[0]).toContain(
      "/catalog/photographers/anna-at-example-sk/hero.jpg",
    );
  });

  it("covers AE3: skips invalid JSON and imports valid entity", async () => {
    const dir = path.join(root, "import", "photographers");
    await fs.writeFile(path.join(dir, "bad.json"), JSON.stringify({ name: "No email" }));
    await fs.writeFile(
      path.join(dir, "good.json"),
      JSON.stringify({ name: "Good", email: "good@example.sk" }),
    );

    const results = await runCatalogImport({
      rootDir: root,
      baseUrl: "http://localhost:3002",
    });

    expect(results).toHaveLength(2);
    expect(results.find((r) => r.fileName === "bad.json")?.status).toBe("failed");
    expect(results.find((r) => r.fileName === "good.json")?.status).toBe("created");
    expect(hasFailures(results)).toBe(true);
  });

  it("covers AE5: re-import passes shorter portfolio URLs to upsert", async () => {
    const dir = path.join(root, "import", "photographers");
    await fs.writeFile(
      path.join(dir, "anna.json"),
      JSON.stringify({
        name: "Anna",
        email: "anna@example.sk",
        portfolio: ["only.jpg"],
      }),
    );
    await fs.writeFile(path.join(dir, "only.jpg"), "img");
    upsertPhotographer.mockResolvedValue({ action: "updated", id: 1 });

    await runCatalogImport({
      rootDir: root,
      baseUrl: "http://localhost:3002",
    });

    expect(upsertPhotographer.mock.calls[0][0].portfolioUrls).toHaveLength(1);
  });

  it("returns empty results for empty folders", async () => {
    const results = await runCatalogImport({
      rootDir: root,
      baseUrl: "http://localhost:3002",
    });
    expect(results).toHaveLength(0);
    expect(hasFailures(results)).toBe(false);
  });
});
