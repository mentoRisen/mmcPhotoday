import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations, persons } from "./schema";
import type { LocationImport, PhotographerImport } from "@/import-catalog/types";

export type UpsertAction = "created" | "updated";

export type UpsertResult = {
  action: UpsertAction;
  id: number;
};

export async function upsertPhotographer(
  record: PhotographerImport & { portfolioUrls: string[] },
): Promise<UpsertResult> {
  const [existing] = await db
    .select({ id: persons.id, type: persons.type })
    .from(persons)
    .where(
      and(eq(persons.email, record.email), eq(persons.type, "photographer")),
    )
    .limit(1);

  if (existing) {
    await db
      .update(persons)
      .set({
        name: record.name,
        description: record.description ?? null,
        instagram: record.instagram ?? null,
        facebook: record.facebook ?? null,
        twitter: record.twitter ?? null,
        website: record.website ?? null,
        portfolioUrls: record.portfolioUrls,
      })
      .where(eq(persons.id, existing.id));

    return { action: "updated", id: existing.id };
  }

  const [result] = await db.insert(persons).values({
    type: "photographer",
    name: record.name,
    email: record.email,
    description: record.description ?? null,
    instagram: record.instagram ?? null,
    facebook: record.facebook ?? null,
    twitter: record.twitter ?? null,
    website: record.website ?? null,
    portfolioUrls: record.portfolioUrls,
  });

  return { action: "created", id: Number(result.insertId) };
}

export async function upsertLocation(
  record: LocationImport & { previewGalleryUrls: string[] },
): Promise<UpsertResult> {
  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.name, record.name))
    .limit(1);

  if (existing) {
    await db
      .update(locations)
      .set({
        description: record.description ?? null,
        address: record.address ?? null,
        latitude:
          record.latitude !== undefined ? String(record.latitude) : null,
        longitude:
          record.longitude !== undefined ? String(record.longitude) : null,
        previewGalleryUrls: record.previewGalleryUrls,
      })
      .where(eq(locations.id, existing.id));

    return { action: "updated", id: existing.id };
  }

  const [result] = await db.insert(locations).values({
    name: record.name,
    description: record.description ?? null,
    address: record.address ?? null,
    latitude: record.latitude !== undefined ? String(record.latitude) : null,
    longitude: record.longitude !== undefined ? String(record.longitude) : null,
    previewGalleryUrls: record.previewGalleryUrls,
  });

  return { action: "created", id: Number(result.insertId) };
}
