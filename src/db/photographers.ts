import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { secureCompare } from "@/lib/secure-compare";
import { persons, type Person } from "./schema";

/** Lists all photographers in enlistment order (ascending id). */
export async function listPhotographers(): Promise<Person[]> {
  return db
    .select()
    .from(persons)
    .where(eq(persons.type, "photographer"))
    .orderBy(asc(persons.id));
}

/** Returns a photographer by id, or null when missing or not a photographer. */
export async function getPhotographerById(id: number): Promise<Person | null> {
  const [row] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.type, "photographer")))
    .limit(1);

  return row ?? null;
}

/** Returns true when the provided login hash matches the photographer record. */
export async function isPhotographerLoginValid(
  photographerId: number,
  loginHash: string,
): Promise<boolean> {
  const photographer = await getPhotographerById(photographerId);
  if (!photographer?.loginHash) {
    return false;
  }

  return secureCompare(loginHash, photographer.loginHash);
}
