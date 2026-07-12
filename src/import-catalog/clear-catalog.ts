import fs from "node:fs/promises";
import path from "node:path";
import { clearCatalogFromDb, type CatalogClearCounts } from "@/db/catalog-clear";

export type RunCatalogClearOptions = {
  rootDir: string;
  publicRoot?: string;
};

export type CatalogClearResult = CatalogClearCounts & {
  catalogDirRemoved: boolean;
};

export async function clearCatalogPublicDir(
  publicRoot: string,
): Promise<boolean> {
  const catalogDir = path.join(publicRoot, "catalog");
  try {
    await fs.access(catalogDir);
  } catch {
    return false;
  }

  await fs.rm(catalogDir, { recursive: true, force: true });
  return true;
}

export async function runCatalogClear(
  options: RunCatalogClearOptions,
): Promise<CatalogClearResult> {
  const publicRoot = options.publicRoot ?? path.join(options.rootDir, "public");
  const counts = await clearCatalogFromDb();
  const catalogDirRemoved = await clearCatalogPublicDir(publicRoot);

  return {
    ...counts,
    catalogDirRemoved,
  };
}

export function formatClearReport(result: CatalogClearResult): string {
  const lines = [
    "Catalog clear summary:",
    "",
    `  Bookings deleted: ${result.bookingsDeleted}`,
    `  Photographers deleted: ${result.photographersDeleted}`,
    `  Locations deleted: ${result.locationsDeleted}`,
    `  public/catalog removed: ${result.catalogDirRemoved ? "yes" : "no (already absent)"}`,
  ];

  return lines.join("\n");
}
