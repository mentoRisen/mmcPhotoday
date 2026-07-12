import { asc } from "drizzle-orm";
import { db } from "@/db";
import { locations, type Location } from "./schema";

/** Lists all locations in enlistment order (ascending id). */
export async function listLocations(): Promise<Location[]> {
  return db.select().from(locations).orderBy(asc(locations.id));
}
