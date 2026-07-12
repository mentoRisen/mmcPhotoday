import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import {
  bookings,
  locations,
  persons,
  timeslots,
  type Booking,
} from "./schema";
import {
  assertSessionSlotAvailable,
  NonBookableTimeslotError,
  prepareSessionSlotWrite,
} from "./bookings";
import { normalizeEmail } from "./cosplayers";

export class ApplicationNotFoundError extends Error {
  constructor() {
    super("Application not found");
    this.name = "ApplicationNotFoundError";
  }
}

export class ApplicationForbiddenError extends Error {
  constructor() {
    super("Application does not belong to this photographer");
    this.name = "ApplicationForbiddenError";
  }
}

export class InvalidApplicationStatusError extends Error {
  constructor() {
    super("Application status does not allow this action");
    this.name = "InvalidApplicationStatusError";
  }
}

export type LocationTimeslotKey = {
  locationId: number;
  timeslotId: number;
};

export type PhotographerTimeslotKey = {
  photographerId: number;
  timeslotId: number;
};

export type ConfirmApplicationInput = {
  locationId: number;
  timeslotId: number;
};

export type ApplicationDetail = {
  id: number;
  status: Booking["status"];
  createdAt: Date;
  cosplayerName: string;
  cosplayerEmail: string;
  photographerId: number;
  photographerName: string;
  photographerEmail: string;
  photographerLoginHash: string | null;
  locationName: string;
  timeslotLabel: string;
  timeslotStartTime: string;
};

export type CreateApplicationInput = {
  email: string;
  name: string;
  photographerId: number;
  locationId: number;
  timeslotId: number;
};

export type PhotographerApplicationSummary = {
  id: number;
  status: Booking["status"];
  createdAt: Date;
  cosplayerName: string;
  locationId: number;
  locationName: string;
  timeslotId: number;
  timeslotLabel: string;
  timeslotStartTime: string;
};

export type ConfirmedSessionSummary = {
  id: number;
  cosplayerName: string;
  photographerId: number;
  photographerName: string;
  locationId: number;
  locationName: string;
  timeslotId: number;
  timeslotLabel: string;
  timeslotStartTime: string;
};

export function confirmedSessionKey(
  locationId: number,
  timeslotId: number,
): string {
  return `${locationId}:${timeslotId}`;
}

const cosplayerPersons = alias(persons, "cosplayer_persons");
const photographerPersons = alias(persons, "photographer_persons");

export async function listApplicationsForPhotographer(
  photographerId: number,
): Promise<PhotographerApplicationSummary[]> {
  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      createdAt: bookings.createdAt,
      cosplayerName: persons.name,
      locationId: bookings.locationId,
      locationName: locations.name,
      timeslotId: bookings.timeslotId,
      timeslotLabel: timeslots.label,
      timeslotStartTime: timeslots.startTime,
    })
    .from(bookings)
    .innerJoin(persons, eq(bookings.cosplayerId, persons.id))
    .innerJoin(locations, eq(bookings.locationId, locations.id))
    .innerJoin(timeslots, eq(bookings.timeslotId, timeslots.id))
    .where(eq(bookings.photographerId, photographerId))
    .orderBy(desc(bookings.createdAt));

  return rows.map((row) => ({
    ...row,
    timeslotStartTime: String(row.timeslotStartTime),
  }));
}

export async function listConfirmedSessions(): Promise<ConfirmedSessionSummary[]> {
  const rows = await db
    .select({
      id: bookings.id,
      cosplayerName: cosplayerPersons.name,
      photographerId: bookings.photographerId,
      photographerName: photographerPersons.name,
      locationId: bookings.locationId,
      locationName: locations.name,
      timeslotId: bookings.timeslotId,
      timeslotLabel: timeslots.label,
      timeslotStartTime: timeslots.startTime,
    })
    .from(bookings)
    .innerJoin(
      cosplayerPersons,
      eq(bookings.cosplayerId, cosplayerPersons.id),
    )
    .innerJoin(
      photographerPersons,
      eq(bookings.photographerId, photographerPersons.id),
    )
    .innerJoin(locations, eq(bookings.locationId, locations.id))
    .innerJoin(timeslots, eq(bookings.timeslotId, timeslots.id))
    .where(eq(bookings.status, "confirmed"))
    .orderBy(asc(locations.id), asc(timeslots.id));

  return rows.map((row) => ({
    ...row,
    timeslotStartTime: String(row.timeslotStartTime),
  }));
}

export async function confirmApplicationByPhotographer(
  applicationId: number,
  photographerId: number,
  slotChoice: ConfirmApplicationInput,
): Promise<ApplicationDetail> {
  await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, applicationId))
      .limit(1);

    if (!booking) {
      throw new ApplicationNotFoundError();
    }
    if (booking.photographerId !== photographerId) {
      throw new ApplicationForbiddenError();
    }
    if (booking.status !== "pending") {
      throw new InvalidApplicationStatusError();
    }

    await prepareSessionSlotWrite(tx, {
      locationId: slotChoice.locationId,
      timeslotId: slotChoice.timeslotId,
      photographerId,
      excludeBookingId: applicationId,
    });

    await tx
      .update(bookings)
      .set({
        status: "confirmed",
        locationId: slotChoice.locationId,
        timeslotId: slotChoice.timeslotId,
      })
      .where(eq(bookings.id, applicationId));
  });

  const detail = await getApplicationById(applicationId);
  if (!detail) {
    throw new ApplicationNotFoundError();
  }

  return detail;
}

export async function revokeApplicationByPhotographer(
  applicationId: number,
  photographerId: number,
): Promise<ApplicationDetail> {
  await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, applicationId))
      .limit(1);

    if (!booking) {
      throw new ApplicationNotFoundError();
    }
    if (booking.photographerId !== photographerId) {
      throw new ApplicationForbiddenError();
    }
    if (booking.status !== "confirmed") {
      throw new InvalidApplicationStatusError();
    }

    await tx
      .update(bookings)
      .set({ status: "pending" })
      .where(eq(bookings.id, applicationId));
  });

  const detail = await getApplicationById(applicationId);
  if (!detail) {
    throw new ApplicationNotFoundError();
  }

  return detail;
}

export async function listConfirmedPhotographerTimeslotKeys(): Promise<
  PhotographerTimeslotKey[]
> {
  return db
    .select({
      photographerId: bookings.photographerId,
      timeslotId: bookings.timeslotId,
    })
    .from(bookings)
    .where(eq(bookings.status, "confirmed"));
}

export async function listConfirmedLocationTimeslotKeys(): Promise<
  LocationTimeslotKey[]
> {
  return db
    .select({
      locationId: bookings.locationId,
      timeslotId: bookings.timeslotId,
    })
    .from(bookings)
    .where(eq(bookings.status, "confirmed"));
}

export async function getApplicationById(
  id: number,
): Promise<ApplicationDetail | null> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) {
    return null;
  }

  const [cosplayer] = await db
    .select({ name: persons.name, email: persons.email })
    .from(persons)
    .where(eq(persons.id, booking.cosplayerId))
    .limit(1);

  const [photographer] = await db
    .select({
      name: persons.name,
      email: persons.email,
      loginHash: persons.loginHash,
    })
    .from(persons)
    .where(eq(persons.id, booking.photographerId))
    .limit(1);

  const [location] = await db
    .select({ name: locations.name })
    .from(locations)
    .where(eq(locations.id, booking.locationId))
    .limit(1);

  const [timeslot] = await db
    .select({ label: timeslots.label, startTime: timeslots.startTime })
    .from(timeslots)
    .where(eq(timeslots.id, booking.timeslotId))
    .limit(1);

  if (!cosplayer || !photographer || !location || !timeslot) {
    return null;
  }

  return {
    id: booking.id,
    status: booking.status,
    createdAt: booking.createdAt,
    cosplayerName: cosplayer.name,
    cosplayerEmail: cosplayer.email,
    photographerId: booking.photographerId,
    photographerName: photographer.name,
    photographerEmail: photographer.email,
    photographerLoginHash: photographer.loginHash,
    locationName: location.name,
    timeslotLabel: timeslot.label,
    timeslotStartTime: String(timeslot.startTime),
  };
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<ApplicationDetail> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  if (!email || !name) {
    throw new Error("Email and name are required");
  }

  return db.transaction(async (tx) => {
    await assertSessionSlotAvailable(tx, {
      locationId: input.locationId,
      timeslotId: input.timeslotId,
      photographerId: input.photographerId,
    });

    const [slot] = await tx
      .select()
      .from(timeslots)
      .where(eq(timeslots.id, input.timeslotId))
      .limit(1);

    if (!slot) {
      throw new NonBookableTimeslotError();
    }

    const [existingCosplayer] = await tx
      .select()
      .from(persons)
      .where(and(eq(persons.email, email), eq(persons.type, "cosplayer")))
      .limit(1);

    let cosplayer = existingCosplayer;

    if (!cosplayer) {
      const [insertResult] = await tx.insert(persons).values({
        type: "cosplayer",
        name,
        email,
      });
      const cosplayerId = Number(insertResult.insertId);
      const [created] = await tx
        .select()
        .from(persons)
        .where(eq(persons.id, cosplayerId))
        .limit(1);
      if (!created) {
        throw new Error("Cosplayer insert succeeded but row could not be loaded");
      }
      cosplayer = created;
    }

    const [photographer] = await tx
      .select({
        name: persons.name,
        email: persons.email,
        loginHash: persons.loginHash,
      })
      .from(persons)
      .where(eq(persons.id, input.photographerId))
      .limit(1);

    const [location] = await tx
      .select({ name: locations.name })
      .from(locations)
      .where(eq(locations.id, input.locationId))
      .limit(1);

    if (!photographer || !location) {
      throw new Error("Invalid photographer or location selection");
    }

    const [bookingResult] = await tx.insert(bookings).values({
      cosplayerId: cosplayer.id,
      photographerId: input.photographerId,
      locationId: input.locationId,
      timeslotId: input.timeslotId,
      status: "pending",
    });

    const bookingId = Number(bookingResult.insertId);
    const [createdBooking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!createdBooking) {
      throw new Error("Application insert succeeded but row could not be loaded");
    }

    return {
      id: createdBooking.id,
      status: createdBooking.status,
      createdAt: createdBooking.createdAt,
      cosplayerName: cosplayer.name,
      cosplayerEmail: cosplayer.email,
      photographerId: input.photographerId,
      photographerName: photographer.name,
      photographerEmail: photographer.email,
      photographerLoginHash: photographer.loginHash,
      locationName: location.name,
      timeslotLabel: slot.label,
      timeslotStartTime: String(slot.startTime),
    };
  });
}
