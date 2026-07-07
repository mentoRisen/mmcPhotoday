import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, timeslots, type Booking } from "./schema";

export class BookingConflictError extends Error {
  constructor() {
    super("A booking already exists for this location and timeslot");
    this.name = "BookingConflictError";
  }
}

export class NonBookableTimeslotError extends Error {
  constructor() {
    super("The selected timeslot is not bookable");
    this.name = "NonBookableTimeslotError";
  }
}

export type CreateBookingInput = {
  cosplayerId: number;
  photographerId: number;
  locationId: number;
  timeslotId: number;
};

function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const record = error as { errno?: number; code?: string };
  return record.errno === 1062 || record.code === "ER_DUP_ENTRY";
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const [slot] = await db
    .select()
    .from(timeslots)
    .where(eq(timeslots.id, input.timeslotId))
    .limit(1);

  if (!slot?.bookable) {
    throw new NonBookableTimeslotError();
  }

  try {
    const [result] = await db.insert(bookings).values({
      cosplayerId: input.cosplayerId,
      photographerId: input.photographerId,
      locationId: input.locationId,
      timeslotId: input.timeslotId,
      status: "confirmed",
    });

    const insertId = Number(result.insertId);
    const [created] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, insertId))
      .limit(1);

    if (!created) {
      throw new Error("Booking insert succeeded but row could not be loaded");
    }

    return created;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new BookingConflictError();
    }
    throw error;
  }
}
