import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();
const insert = vi.fn();
const transaction = vi.fn();
const execute = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
    insert: (...args: unknown[]) => insert(...args),
    transaction: (fn: (tx: unknown) => Promise<unknown>) => transaction(fn),
    execute: (...args: unknown[]) => execute(...args),
  },
}));

import {
  assertSessionSlotAvailable,
  createBooking,
  BookingConflictError,
  NonBookableTimeslotError,
  PhotographerScheduleConflictError,
} from "./bookings";

function mockSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  select.mockReturnValueOnce({ from });
  return { limit, where, from };
}

function mockInsertChain(insertId: number) {
  const values = vi.fn().mockResolvedValue([{ insertId }]);
  insert.mockReturnValueOnce({ values });
  return values;
}

describe("assertSessionSlotAvailable", () => {
  beforeEach(() => {
    select.mockReset();
  });

  it("passes when location and photographer schedule are free", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    mockSelectChain([]);
    mockSelectChain([]);

    await expect(
      assertSessionSlotAvailable(
        { select },
        { locationId: 3, timeslotId: 2, photographerId: 5 },
      ),
    ).resolves.toBeUndefined();
  });

  it("throws BookingConflictError when location+timeslot is taken", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    mockSelectChain([{ id: 99 }]);

    await expect(
      assertSessionSlotAvailable(
        { select },
        { locationId: 3, timeslotId: 2, photographerId: 5 },
      ),
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("throws PhotographerScheduleConflictError when photographer is busy", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    mockSelectChain([]);
    mockSelectChain([{ id: 88 }]);

    await expect(
      assertSessionSlotAvailable(
        { select },
        { locationId: 3, timeslotId: 2, photographerId: 5 },
      ),
    ).rejects.toBeInstanceOf(PhotographerScheduleConflictError);
  });

  it("throws NonBookableTimeslotError for non-bookable timeslot", async () => {
    mockSelectChain([
      { id: 1, label: "Gatherup", startTime: "09:00:00", bookable: false },
    ]);

    await expect(
      assertSessionSlotAvailable(
        { select },
        { locationId: 3, timeslotId: 1, photographerId: 5 },
      ),
    ).rejects.toBeInstanceOf(NonBookableTimeslotError);
  });
});

describe("createBooking", () => {
  beforeEach(() => {
    select.mockReset();
    insert.mockReset();
    transaction.mockReset();
    execute.mockReset();
    transaction.mockImplementation(async (fn) =>
      fn({
        select: (...args: unknown[]) => select(...args),
        insert: (...args: unknown[]) => insert(...args),
        execute: (...args: unknown[]) => execute(...args),
      }),
    );
    execute.mockResolvedValue([]);
  });

  it("covers AE1: creates a booking for a bookable timeslot", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    mockSelectChain([]);
    mockSelectChain([]);
    mockInsertChain(10);
    mockSelectChain([
      {
        id: 10,
        cosplayerId: 1,
        photographerId: 2,
        locationId: 3,
        timeslotId: 2,
        status: "confirmed",
        createdAt: new Date(),
      },
    ]);

    const booking = await createBooking({
      cosplayerId: 1,
      photographerId: 2,
      locationId: 3,
      timeslotId: 2,
    });

    expect(booking.id).toBe(10);
    expect(booking.status).toBe("confirmed");
    expect(insert).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("covers AE2: throws BookingConflictError when confirmed booking exists", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    mockSelectChain([{ id: 99 }]);

    await expect(
      createBooking({
        cosplayerId: 1,
        photographerId: 2,
        locationId: 3,
        timeslotId: 2,
      }),
    ).rejects.toBeInstanceOf(BookingConflictError);

    expect(insert).not.toHaveBeenCalled();
  });

  it("throws NonBookableTimeslotError for gatherup without inserting", async () => {
    mockSelectChain([
      { id: 1, label: "Gatherup", startTime: "09:00:00", bookable: false },
    ]);

    await expect(
      createBooking({
        cosplayerId: 1,
        photographerId: 2,
        locationId: 3,
        timeslotId: 1,
      }),
    ).rejects.toBeInstanceOf(NonBookableTimeslotError);

    expect(insert).not.toHaveBeenCalled();
  });

  it("throws NonBookableTimeslotError when timeslot is missing", async () => {
    mockSelectChain([]);

    await expect(
      createBooking({
        cosplayerId: 1,
        photographerId: 2,
        locationId: 3,
        timeslotId: 99,
      }),
    ).rejects.toBeInstanceOf(NonBookableTimeslotError);

    expect(insert).not.toHaveBeenCalled();
  });
});
