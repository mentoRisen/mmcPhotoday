import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();
const insert = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
    insert: (...args: unknown[]) => insert(...args),
  },
}));

import {
  createBooking,
  BookingConflictError,
  NonBookableTimeslotError,
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

describe("createBooking", () => {
  beforeEach(() => {
    select.mockReset();
    insert.mockReset();
  });

  it("covers AE1: creates a booking for a bookable timeslot", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
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
  });

  it("covers AE2: throws BookingConflictError on duplicate location-timeslot", async () => {
    mockSelectChain([
      { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    const values = vi.fn().mockRejectedValue({ errno: 1062, code: "ER_DUP_ENTRY" });
    insert.mockReturnValueOnce({ values });

    await expect(
      createBooking({
        cosplayerId: 1,
        photographerId: 2,
        locationId: 3,
        timeslotId: 2,
      }),
    ).rejects.toBeInstanceOf(BookingConflictError);
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
