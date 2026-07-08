import fs from "node:fs/promises";
import path from "node:path";
import type { ScanResult } from "./types";

function galleryFilenamesFromJson(raw: unknown): string[] {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return [];
  }
  const record = raw as Record<string, unknown>;
  const portfolio = record.portfolio;
  const previewGallery = record.previewGallery;
  const filenames: string[] = [];
  if (Array.isArray(portfolio)) {
    for (const item of portfolio) {
      if (typeof item === "string") filenames.push(item);
    }
  }
  if (Array.isArray(previewGallery)) {
    for (const item of previewGallery) {
      if (typeof item === "string") filenames.push(item);
    }
  }
  return filenames;
}

export async function scanImportFolder(dir: string): Promise<ScanResult> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if (isEnoent(error)) {
      return { files: [], collisionErrors: new Map() };
    }
    throw error;
  }

  const jsonFiles = entries.filter((name) => name.endsWith(".json")).sort();
  const files = await Promise.all(
    jsonFiles.map(async (fileName) => {
      const filePath = path.join(dir, fileName);
      const content = await fs.readFile(filePath, "utf8");
      const raw = JSON.parse(content) as unknown;
      return { filePath, fileName, raw };
    }),
  );

  const filenameToJsons = new Map<string, string[]>();
  for (const file of files) {
    for (const galleryFile of galleryFilenamesFromJson(file.raw)) {
      const list = filenameToJsons.get(galleryFile) ?? [];
      list.push(file.fileName);
      filenameToJsons.set(galleryFile, list);
    }
  }

  const collisionErrors = new Map<string, string>();
  for (const [galleryFilename, jsonNames] of filenameToJsons) {
    const unique = [...new Set(jsonNames)];
    if (unique.length > 1) {
      const message = `Gallery filename "${galleryFilename}" is referenced by multiple JSON files: ${unique.join(", ")}`;
      for (const jsonName of unique) {
        collisionErrors.set(jsonName, message);
      }
    }
  }

  return { files, collisionErrors };
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
