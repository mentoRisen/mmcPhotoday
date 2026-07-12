import fs from "node:fs/promises";
import path from "node:path";
import { buildGalleryUrls } from "./build-urls";
import { copyGalleryImages } from "./copy-images";
import { scanImportFolder } from "./scan";
import { slugFromEmail, slugFromName } from "./slug";
import type { EntityType, ImportResult } from "./types";
import {
  validateLocationJson,
  validatePhotographerJson,
} from "./validate";
import { upsertLocation, upsertPhotographer } from "@/db/catalog-import";
import { sendPhotographerInvitationById } from "@/db/photographer-invitations";

export type RunCatalogImportOptions = {
  rootDir: string;
  baseUrl: string;
  publicRoot?: string;
  sendPhotographerInvitations?: boolean;
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function verifyGalleryFilesExist(
  importDir: string,
  filenames: string[] | undefined,
): Promise<string | null> {
  if (!filenames?.length) return null;
  for (const filename of filenames) {
    if (!(await fileExists(path.join(importDir, filename)))) {
      return `Missing image file: ${filename}`;
    }
  }
  return null;
}

async function importPhotographersFolder(
  options: RunCatalogImportOptions,
): Promise<ImportResult[]> {
  const importDir = path.join(options.rootDir, "import", "photographers");
  const publicRoot = options.publicRoot ?? path.join(options.rootDir, "public");
  const scan = await scanImportFolder(importDir);
  const results: ImportResult[] = [];
  const usedSlugs = new Set<string>();

  for (const file of scan.files) {
    const entityType: EntityType = "photographers";

    if (scan.collisionErrors.has(file.fileName)) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: scan.collisionErrors.get(file.fileName),
      });
      continue;
    }

    const validated = validatePhotographerJson(file.raw);
    if (!validated.ok) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: validated.error,
      });
      continue;
    }

    const slug = slugFromEmail(validated.value.email);
    if (!slug) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: "Could not derive slug from email",
      });
      continue;
    }

    if (usedSlugs.has(slug)) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: `Slug collision: "${slug}" is already used in this import run`,
      });
      continue;
    }
    usedSlugs.add(slug);

    const missingImage = await verifyGalleryFilesExist(
      importDir,
      validated.value.portfolio,
    );
    if (missingImage) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: missingImage,
      });
      continue;
    }

    const filenames = validated.value.portfolio ?? [];
    if (filenames.length > 0) {
      const copied = await copyGalleryImages({
        importDir,
        publicRoot,
        entityType,
        slug,
        filenames,
      });
      if (!copied.ok) {
        results.push({
          entityType,
          fileName: file.fileName,
          status: "failed",
          message: copied.error,
        });
        continue;
      }
    }

    const portfolioUrls = buildGalleryUrls(
      options.baseUrl,
      entityType,
      slug,
      filenames,
    );

    try {
      const upsert = await upsertPhotographer({
        ...validated.value,
        portfolioUrls,
      });
      results.push({
        entityType,
        fileName: file.fileName,
        status: upsert.action,
      });

      if (
        upsert.action === "created" &&
        options.sendPhotographerInvitations !== false
      ) {
        const invitation = await sendPhotographerInvitationById(upsert.id);
        if (invitation.status === "sent") {
          console.log(
            `[invitation] sent to #${invitation.photographerId} ${invitation.name} <${invitation.email}>`,
          );
        } else if (invitation.status === "failed") {
          console.warn(
            `[invitation] failed for #${invitation.photographerId} ${invitation.name}: ${invitation.error}`,
          );
        } else if (invitation.status === "skipped") {
          console.warn(
            `[invitation] skipped for #${invitation.photographerId} ${invitation.name}: ${invitation.reason}`,
          );
        }
      }
    } catch (error) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function importLocationsFolder(
  options: RunCatalogImportOptions,
): Promise<ImportResult[]> {
  const importDir = path.join(options.rootDir, "import", "locations");
  const publicRoot = options.publicRoot ?? path.join(options.rootDir, "public");
  const scan = await scanImportFolder(importDir);
  const results: ImportResult[] = [];
  const usedSlugs = new Set<string>();

  for (const file of scan.files) {
    const entityType: EntityType = "locations";

    if (scan.collisionErrors.has(file.fileName)) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: scan.collisionErrors.get(file.fileName),
      });
      continue;
    }

    const validated = validateLocationJson(file.raw);
    if (!validated.ok) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: validated.error,
      });
      continue;
    }

    const slug = slugFromName(validated.value.name);
    if (!slug) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: "Could not derive slug from name",
      });
      continue;
    }

    if (usedSlugs.has(slug)) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: `Slug collision: "${slug}" is already used in this import run`,
      });
      continue;
    }
    usedSlugs.add(slug);

    const missingImage = await verifyGalleryFilesExist(
      importDir,
      validated.value.previewGallery,
    );
    if (missingImage) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: missingImage,
      });
      continue;
    }

    const filenames = validated.value.previewGallery ?? [];
    if (filenames.length > 0) {
      const copied = await copyGalleryImages({
        importDir,
        publicRoot,
        entityType,
        slug,
        filenames,
      });
      if (!copied.ok) {
        results.push({
          entityType,
          fileName: file.fileName,
          status: "failed",
          message: copied.error,
        });
        continue;
      }
    }

    const previewGalleryUrls = buildGalleryUrls(
      options.baseUrl,
      entityType,
      slug,
      filenames,
    );

    try {
      const upsert = await upsertLocation({
        ...validated.value,
        previewGalleryUrls,
      });
      results.push({
        entityType,
        fileName: file.fileName,
        status: upsert.action,
      });
    } catch (error) {
      results.push({
        entityType,
        fileName: file.fileName,
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

export async function runCatalogImport(
  options: RunCatalogImportOptions,
): Promise<ImportResult[]> {
  const photographerResults = await importPhotographersFolder(options);
  const locationResults = await importLocationsFolder(options);
  return [...photographerResults, ...locationResults];
}
