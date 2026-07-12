import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, locations, persons } from "./schema";

export type CatalogClearCounts = {
  bookingsDeleted: number;
  photographersDeleted: number;
  locationsDeleted: number;
};

export async function clearCatalogFromDb(): Promise<CatalogClearCounts> {
  const [bookingResult] = await db.delete(bookings);
  const [photographerResult] = await db
    .delete(persons)
    .where(eq(persons.type, "photographer"));
  const [locationResult] = await db.delete(locations);

  return {
    bookingsDeleted: bookingResult.affectedRows ?? 0,
    photographersDeleted: photographerResult.affectedRows ?? 0,
    locationsDeleted: locationResult.affectedRows ?? 0,
  };
}
