import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { persons, type Person } from "./schema";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Finds a cosplayer profile by email, or null when none exists. */
export async function findCosplayerByEmail(
  email: string,
): Promise<Person | null> {
  const normalized = normalizeEmail(email);
  const [row] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.email, normalized), eq(persons.type, "cosplayer")))
    .limit(1);

  return row ?? null;
}
