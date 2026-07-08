import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { persons, type Person } from "./schema";

/** Lists all photographers in enlistment order (ascending id). */
export async function listPhotographers(): Promise<Person[]> {
  return db
    .select()
    .from(persons)
    .where(eq(persons.type, "photographer"))
    .orderBy(asc(persons.id));
}
