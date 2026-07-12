import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, timeslots, type Booking } from "./schema";

export class BookingConflictError extends Error {
  constructor() {
    super("A booking already exists for this location and timeslot");
    this.name = "BookingConflictError";
  }
}

export class PhotographerScheduleConflictError extends Error {
  constructor() {
    super("The photographer already has a confirmed session at this timeslot");
    this.name = "PhotographerScheduleConflictError";
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

export type SessionSlotInput = {
  locationId: number;
  timeslotId: number;
  photographerId: number;
  excludeBookingId?: number;
};

type DbClient = Pick<typeof db, "select" | "execute">;

async function lockSessionSlotRows(
  client: DbClient,
  input: SessionSlotInput,
): Promise<void> {
  await client.execute(
    sql`SELECT id FROM bookings WHERE photographer_id = ${input.photographerId} AND timeslot_id = ${input.timeslotId} FOR UPDATE`,
  );
  await client.execute(
    sql`SELECT id FROM bookings WHERE location_id = ${input.locationId} AND timeslot_id = ${input.timeslotId} FOR UPDATE`,
  );
}

export async function prepareSessionSlotWrite(
  client: DbClient,
  input: SessionSlotInput,
): Promise<void> {
  await lockSessionSlotRows(client, input);
  await assertSessionSlotAvailable(client, input);
}

export async function hasConfirmedBookingAtSlot(
  locationId: number,
  timeslotId: number,
  excludeBookingId?: number,
): Promise<boolean> {
  return hasConfirmedBookingAtSlotWithClient(db, locationId, timeslotId, excludeBookingId);
}

async function hasConfirmedBookingAtSlotWithClient(
  client: DbClient,
  locationId: number,
  timeslotId: number,
  excludeBookingId?: number,
): Promise<boolean> {
  const conditions = [
    eq(bookings.locationId, locationId),
    eq(bookings.timeslotId, timeslotId),
    eq(bookings.status, "confirmed"),
  ];
  if (excludeBookingId !== undefined) {
    conditions.push(ne(bookings.id, excludeBookingId));
  }

  const [row] = await client
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(...conditions))
    .limit(1);

  return row !== undefined;
}

export async function hasConfirmedBookingForPhotographerAtTimeslot(
  photographerId: number,
  timeslotId: number,
  excludeBookingId?: number,
): Promise<boolean> {
  return hasConfirmedBookingForPhotographerAtTimeslotWithClient(
    db,
    photographerId,
    timeslotId,
    excludeBookingId,
  );
}

async function hasConfirmedBookingForPhotographerAtTimeslotWithClient(
  client: DbClient,
  photographerId: number,
  timeslotId: number,
  excludeBookingId?: number,
): Promise<boolean> {
  const conditions = [
    eq(bookings.photographerId, photographerId),
    eq(bookings.timeslotId, timeslotId),
    eq(bookings.status, "confirmed"),
  ];
  if (excludeBookingId !== undefined) {
    conditions.push(ne(bookings.id, excludeBookingId));
  }

  const [row] = await client
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(...conditions))
    .limit(1);

  return row !== undefined;
}

export async function assertSessionSlotAvailable(
  client: DbClient,
  input: SessionSlotInput,
): Promise<void> {
  const [slot] = await client
    .select()
    .from(timeslots)
    .where(eq(timeslots.id, input.timeslotId))
    .limit(1);

  if (!slot?.bookable) {
    throw new NonBookableTimeslotError();
  }

  if (
    await hasConfirmedBookingAtSlotWithClient(
      client,
      input.locationId,
      input.timeslotId,
      input.excludeBookingId,
    )
  ) {
    throw new BookingConflictError();
  }

  if (
    await hasConfirmedBookingForPhotographerAtTimeslotWithClient(
      client,
      input.photographerId,
      input.timeslotId,
      input.excludeBookingId,
    )
  ) {
    throw new PhotographerScheduleConflictError();
  }
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  return db.transaction(async (tx) => {
    await prepareSessionSlotWrite(tx, {
      locationId: input.locationId,
      timeslotId: input.timeslotId,
      photographerId: input.photographerId,
    });

    const [result] = await tx.insert(bookings).values({
      cosplayerId: input.cosplayerId,
      photographerId: input.photographerId,
      locationId: input.locationId,
      timeslotId: input.timeslotId,
      status: "confirmed",
    });

    const insertId = Number(result.insertId);
    const [created] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, insertId))
      .limit(1);

    if (!created) {
      throw new Error("Booking insert succeeded but row could not be loaded");
    }

    return created;
  });
}
