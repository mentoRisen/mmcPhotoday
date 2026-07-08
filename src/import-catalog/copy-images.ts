import fs from "node:fs/promises";
import path from "node:path";
import type { EntityType } from "./types";

export type CopyGalleryImagesInput = {
  importDir: string;
  publicRoot: string;
  entityType: EntityType;
  slug: string;
  filenames: string[];
};

export type CopyGalleryImagesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function copyGalleryImages(
  input: CopyGalleryImagesInput,
): Promise<CopyGalleryImagesResult> {
  const { importDir, publicRoot, entityType, slug, filenames } = input;
  const destDir = path.join(publicRoot, "catalog", entityType, slug);
  await fs.mkdir(destDir, { recursive: true });

  for (const filename of filenames) {
    const source = path.join(importDir, filename);
    const dest = path.join(destDir, filename);
    try {
      await fs.copyFile(source, dest);
    } catch (error) {
      if (isEnoent(error)) {
        return { ok: false, error: `Missing image file: ${filename}` };
      }
      throw error;
    }
  }

  return { ok: true };
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
