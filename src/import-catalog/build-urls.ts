import type { EntityType } from "./types";

export function buildGalleryUrls(
  baseUrl: string,
  entityType: EntityType,
  slug: string,
  filenames: string[],
): string[] {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return filenames.map(
    (filename) =>
      `${normalizedBase}/catalog/${entityType}/${slug}/${filename}`,
  );
}
