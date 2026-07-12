import { and, eq } from "drizzle-orm";
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

export async function hasConfirmedBookingAtSlot(
  locationId: number,
  timeslotId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.locationId, locationId),
        eq(bookings.timeslotId, timeslotId),
        eq(bookings.status, "confirmed"),
      ),
    )
    .limit(1);

  return row !== undefined;
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

  if (await hasConfirmedBookingAtSlot(input.locationId, input.timeslotId)) {
    throw new BookingConflictError();
  }

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
}
