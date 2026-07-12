import { asc } from "drizzle-orm";
import { db } from "@/db";
import { timeslots, type Timeslot } from "./schema";

/** Lists bookable shoot timeslots in schedule order. */
export async function listBookableTimeslots(): Promise<Timeslot[]> {
  const rows = await db.select().from(timeslots).orderBy(asc(timeslots.id));
  return rows.filter((slot) => slot.bookable);
}
