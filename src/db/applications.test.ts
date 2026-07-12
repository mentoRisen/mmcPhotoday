import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();
const insert = vi.fn();
const transaction = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
    insert: (...args: unknown[]) => insert(...args),
    transaction: (fn: (tx: unknown) => Promise<unknown>) => transaction(fn),
  },
}));

import {
  createApplication,
  confirmApplicationByPhotographer,
  listApplicationsForPhotographer,
  listConfirmedLocationTimeslotKeys,
  listConfirmedPhotographerTimeslotKeys,
  listConfirmedSessions,
  revokeApplicationByPhotographer,
} from "./applications";
import {
  BookingConflictError,
  NonBookableTimeslotError,
  PhotographerScheduleConflictError,
} from "./bookings";

describe("applications", () => {
  beforeEach(() => {
    select.mockReset();
    insert.mockReset();
    transaction.mockReset();
  });

  it("listConfirmedPhotographerTimeslotKeys returns only confirmed rows", async () => {
    const where = vi.fn().mockResolvedValue([
      { photographerId: 10, timeslotId: 2 },
    ]);
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValueOnce({ from });

    await expect(listConfirmedPhotographerTimeslotKeys()).resolves.toEqual([
      { photographerId: 10, timeslotId: 2 },
    ]);
  });

  it("listConfirmedLocationTimeslotKeys returns only confirmed rows", async () => {
    const where = vi.fn().mockResolvedValue([
      { locationId: 1, timeslotId: 2 },
    ]);
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValueOnce({ from });

    await expect(listConfirmedLocationTimeslotKeys()).resolves.toEqual([
      { locationId: 1, timeslotId: 2 },
    ]);
  });

  it("covers AE1: createApplication with new email creates cosplayer and pending booking", async () => {
    transaction.mockImplementation(async (fn) => {
      let selectCall = 0;
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => {
                selectCall += 1;
                if (selectCall === 1) {
                  return [
                    {
                      id: 2,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                if (selectCall === 2 || selectCall === 3) {
                  return [];
                }
                if (selectCall === 4) {
                  return [
                    {
                      id: 2,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                if (selectCall === 5) {
                  return [
                    {
                      id: 1,
                      type: "cosplayer",
                      name: "New Cosplayer",
                      email: "new@example.com",
                    },
                  ];
                }
                if (selectCall === 6) {
                  return [
                    {
                      name: "Anna",
                      email: "anna@example.sk",
                      loginHash: "secret-hash",
                    },
                  ];
                }
                if (selectCall === 7) {
                  return [{ name: "Castle" }];
                }
                if (selectCall === 8) {
                  return [
                    {
                      id: 10,
                      status: "pending",
                      createdAt: new Date("2026-07-11T09:00:00Z"),
                    },
                  ];
                }
                return [];
              }),
            }),
          }),
        }),
        insert: () => ({
          values: vi
            .fn()
            .mockResolvedValueOnce([{ insertId: 1 }])
            .mockResolvedValueOnce([{ insertId: 10 }]),
        }),
      };
      return fn(tx);
    });

    const detail = await createApplication({
      email: "new@example.com",
      name: "New Cosplayer",
      photographerId: 2,
      locationId: 3,
      timeslotId: 2,
    });

    expect(detail.status).toBe("pending");
    expect(detail.cosplayerEmail).toBe("new@example.com");
    expect(detail.photographerEmail).toBe("anna@example.sk");
    expect(detail.photographerLoginHash).toBe("secret-hash");
    expect(detail.id).toBe(10);
  });

  it("covers AE4: rejects non-bookable timeslot", async () => {
    transaction.mockImplementation(async (fn) => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn().mockResolvedValueOnce([
                {
                  id: 1,
                  label: "Gatherup",
                  startTime: "09:00:00",
                  bookable: false,
                },
              ]),
            }),
          }),
        }),
        insert: vi.fn(),
      };
      return fn(tx);
    });

    await expect(
      createApplication({
        email: "x@example.com",
        name: "X",
        photographerId: 2,
        locationId: 3,
        timeslotId: 1,
      }),
    ).rejects.toBeInstanceOf(NonBookableTimeslotError);
  });

  it("throws PhotographerScheduleConflictError when photographer is busy", async () => {
    transaction.mockImplementation(async (fn) => {
      let selectCall = 0;
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => {
                selectCall += 1;
                if (selectCall === 1) {
                  return [
                    {
                      id: 2,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                if (selectCall === 2) {
                  return [];
                }
                if (selectCall === 3) {
                  return [{ id: 88 }];
                }
                return [];
              }),
            }),
          }),
        }),
        insert: vi.fn(),
      };
      return fn(tx);
    });

    await expect(
      createApplication({
        email: "x@example.com",
        name: "X",
        photographerId: 2,
        locationId: 3,
        timeslotId: 2,
      }),
    ).rejects.toBeInstanceOf(PhotographerScheduleConflictError);
  });

  it("throws BookingConflictError when confirmed booking occupies slot", async () => {
    transaction.mockImplementation(async (fn) => {
      let selectCall = 0;
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => {
                selectCall += 1;
                if (selectCall === 1) {
                  return [
                    {
                      id: 2,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                if (selectCall === 2) {
                  return [{ id: 99 }];
                }
                return [];
              }),
            }),
          }),
        }),
        insert: vi.fn(),
      };
      return fn(tx);
    });

    await expect(
      createApplication({
        email: "x@example.com",
        name: "X",
        photographerId: 2,
        locationId: 3,
        timeslotId: 2,
      }),
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("listApplicationsForPhotographer returns joined application summaries", async () => {
    const orderBy = vi.fn().mockResolvedValue([
      {
        id: 1,
        status: "pending",
        createdAt: new Date("2026-07-11T09:00:00Z"),
        cosplayerName: "Anna",
        locationId: 1,
        locationName: "Castle",
        timeslotId: 2,
        timeslotLabel: "First shoot",
        timeslotStartTime: "09:30:00",
      },
    ]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoinTimeslots = vi.fn().mockReturnValue({ where });
    const innerJoinLocations = vi.fn().mockReturnValue({
      innerJoin: innerJoinTimeslots,
    });
    const innerJoinPersons = vi.fn().mockReturnValue({
      innerJoin: innerJoinLocations,
    });
    const from = vi.fn().mockReturnValue({ innerJoin: innerJoinPersons });
    select.mockReturnValueOnce({ from });

    await expect(listApplicationsForPhotographer(10)).resolves.toEqual([
      {
        id: 1,
        status: "pending",
        createdAt: new Date("2026-07-11T09:00:00Z"),
        cosplayerName: "Anna",
        locationId: 1,
        locationName: "Castle",
        timeslotId: 2,
        timeslotLabel: "First shoot",
        timeslotStartTime: "09:30:00",
      },
    ]);
  });

  it("listConfirmedSessions returns only confirmed rows with joined fields", async () => {
    const orderBy = vi.fn().mockResolvedValue([
      {
        id: 5,
        cosplayerName: "Mia",
        photographerId: 10,
        photographerName: "Betty",
        locationId: 1,
        locationName: "Castle",
        timeslotId: 2,
        timeslotLabel: "Second shoot",
        timeslotStartTime: "11:00:00",
      },
    ]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoinTimeslots = vi.fn().mockReturnValue({ where });
    const innerJoinLocations = vi.fn().mockReturnValue({
      innerJoin: innerJoinTimeslots,
    });
    const innerJoinPhotographer = vi.fn().mockReturnValue({
      innerJoin: innerJoinLocations,
    });
    const innerJoinCosplayer = vi.fn().mockReturnValue({
      innerJoin: innerJoinPhotographer,
    });
    const from = vi.fn().mockReturnValue({ innerJoin: innerJoinCosplayer });
    select.mockReturnValueOnce({ from });

    await expect(listConfirmedSessions()).resolves.toEqual([
      {
        id: 5,
        cosplayerName: "Mia",
        photographerId: 10,
        photographerName: "Betty",
        locationId: 1,
        locationName: "Castle",
        timeslotId: 2,
        timeslotLabel: "Second shoot",
        timeslotStartTime: "11:00:00",
      },
    ]);
  });

  it("listConfirmedSessions returns empty array when no confirmed bookings", async () => {
    const orderBy = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoinTimeslots = vi.fn().mockReturnValue({ where });
    const innerJoinLocations = vi.fn().mockReturnValue({
      innerJoin: innerJoinTimeslots,
    });
    const innerJoinPhotographer = vi.fn().mockReturnValue({
      innerJoin: innerJoinLocations,
    });
    const innerJoinCosplayer = vi.fn().mockReturnValue({
      innerJoin: innerJoinPhotographer,
    });
    const from = vi.fn().mockReturnValue({ innerJoin: innerJoinCosplayer });
    select.mockReturnValueOnce({ from });

    await expect(listConfirmedSessions()).resolves.toEqual([]);
  });

  it("confirmApplicationByPhotographer sets pending booking to confirmed with override", async () => {
    const whereUpdate = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where: whereUpdate });
    const update = vi.fn().mockReturnValue({ set });

    transaction.mockImplementation(async (fn) => {
      let selectCall = 0;
      const tx = {
        execute: vi.fn().mockResolvedValue([]),
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => {
                selectCall += 1;
                if (selectCall === 1) {
                  return [
                    {
                      id: 1,
                      photographerId: 10,
                      locationId: 8,
                      timeslotId: 3,
                      status: "pending",
                    },
                  ];
                }
                if (selectCall === 2) {
                  return [
                    {
                      id: 3,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                return [];
              }),
            }),
          }),
        }),
        update,
      };
      return fn(tx);
    });

    const limit = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 1,
          status: "confirmed",
          createdAt: new Date("2026-07-11T09:00:00Z"),
          cosplayerId: 5,
          photographerId: 10,
          locationId: 9,
          timeslotId: 3,
        },
      ])
      .mockResolvedValueOnce([{ name: "Anna", email: "anna@example.com" }])
      .mockResolvedValueOnce([
        { name: "Betty", email: "betty@example.sk", loginHash: "hash" },
      ])
      .mockResolvedValueOnce([{ name: "Square" }])
      .mockResolvedValueOnce([
        { label: "First shoot", startTime: "09:30:00" },
      ]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValue({ from });

    const detail = await confirmApplicationByPhotographer(1, 10, {
      locationId: 9,
      timeslotId: 3,
    });

    expect(detail.status).toBe("confirmed");
    expect(detail.locationName).toBe("Square");
    expect(set).toHaveBeenCalledWith({
      status: "confirmed",
      locationId: 9,
      timeslotId: 3,
    });
  });

  it("confirmApplicationByPhotographer rejects photographer schedule conflict", async () => {
    const update = vi.fn();

    transaction.mockImplementation(async (fn) => {
      let selectCall = 0;
      const tx = {
        execute: vi.fn().mockResolvedValue([]),
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => {
                selectCall += 1;
                if (selectCall === 1) {
                  return [
                    {
                      id: 1,
                      photographerId: 10,
                      locationId: 8,
                      timeslotId: 3,
                      status: "pending",
                    },
                  ];
                }
                if (selectCall === 2) {
                  return [
                    {
                      id: 3,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                if (selectCall === 3) {
                  return [];
                }
                if (selectCall === 4) {
                  return [{ id: 88 }];
                }
                return [];
              }),
            }),
          }),
        }),
        update,
      };
      return fn(tx);
    });

    await expect(
      confirmApplicationByPhotographer(1, 10, {
        locationId: 9,
        timeslotId: 3,
      }),
    ).rejects.toBeInstanceOf(PhotographerScheduleConflictError);

    expect(update).not.toHaveBeenCalled();
  });

  it("confirmApplicationByPhotographer rejects location+timeslot conflict", async () => {
    const update = vi.fn();

    transaction.mockImplementation(async (fn) => {
      let selectCall = 0;
      const tx = {
        execute: vi.fn().mockResolvedValue([]),
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => {
                selectCall += 1;
                if (selectCall === 1) {
                  return [
                    {
                      id: 1,
                      photographerId: 10,
                      locationId: 8,
                      timeslotId: 3,
                      status: "pending",
                    },
                  ];
                }
                if (selectCall === 2) {
                  return [
                    {
                      id: 3,
                      label: "First shoot",
                      startTime: "09:30:00",
                      bookable: true,
                    },
                  ];
                }
                if (selectCall === 3) {
                  return [{ id: 99 }];
                }
                return [];
              }),
            }),
          }),
        }),
        update,
      };
      return fn(tx);
    });

    await expect(
      confirmApplicationByPhotographer(1, 10, {
        locationId: 9,
        timeslotId: 3,
      }),
    ).rejects.toBeInstanceOf(BookingConflictError);

    expect(update).not.toHaveBeenCalled();
  });

  it("revokeApplicationByPhotographer sets confirmed booking to pending", async () => {
    const whereUpdate = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where: whereUpdate });
    const update = vi.fn().mockReturnValue({ set });

    transaction.mockImplementation(async (fn) => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: vi.fn(async () => [
                {
                  id: 2,
                  photographerId: 10,
                  locationId: 8,
                  timeslotId: 3,
                  status: "confirmed",
                },
              ]),
            }),
          }),
        }),
        update,
      };
      return fn(tx);
    });

    const limit = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 2,
          status: "pending",
          createdAt: new Date("2026-07-11T09:00:00Z"),
          cosplayerId: 5,
          photographerId: 10,
          locationId: 8,
          timeslotId: 3,
        },
      ])
      .mockResolvedValueOnce([{ name: "Anna", email: "anna@example.com" }])
      .mockResolvedValueOnce([
        { name: "Betty", email: "betty@example.sk", loginHash: "hash" },
      ])
      .mockResolvedValueOnce([{ name: "Square" }])
      .mockResolvedValueOnce([
        { label: "First shoot", startTime: "09:30:00" },
      ]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValue({ from });

    const detail = await revokeApplicationByPhotographer(2, 10);

    expect(set).toHaveBeenCalledWith({ status: "pending" });
    expect(detail.status).toBe("pending");
    expect(detail.timeslotStartTime).toBe("09:30:00");
  });
});
