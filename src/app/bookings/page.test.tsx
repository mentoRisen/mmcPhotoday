import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const listPhotographers = vi.fn();
const listLocations = vi.fn();
const listBookableTimeslots = vi.fn();
const listConfirmedLocationTimeslotKeys = vi.fn();
const listConfirmedPhotographerTimeslotKeys = vi.fn();

vi.mock("@/db/photographers", () => ({
  listPhotographers: (...args: unknown[]) => listPhotographers(...args),
}));

vi.mock("@/db/locations", () => ({
  listLocations: (...args: unknown[]) => listLocations(...args),
}));

vi.mock("@/db/timeslots", () => ({
  listBookableTimeslots: (...args: unknown[]) => listBookableTimeslots(...args),
}));

vi.mock("@/db/applications", () => ({
  listConfirmedLocationTimeslotKeys: (...args: unknown[]) =>
    listConfirmedLocationTimeslotKeys(...args),
  listConfirmedPhotographerTimeslotKeys: (...args: unknown[]) =>
    listConfirmedPhotographerTimeslotKeys(...args),
}));

import BookingsPage from "./page";

describe("bookings page", () => {
  beforeEach(() => {
    listPhotographers.mockReset();
    listLocations.mockReset();
    listBookableTimeslots.mockReset();
    listConfirmedLocationTimeslotKeys.mockReset();
    listConfirmedPhotographerTimeslotKeys.mockReset();
    listConfirmedLocationTimeslotKeys.mockResolvedValue([]);
    listConfirmedPhotographerTimeslotKeys.mockResolvedValue([]);
  });

  it("shows empty state when catalog is not ready", async () => {
    listPhotographers.mockResolvedValue([]);
    listLocations.mockResolvedValue([]);
    listBookableTimeslots.mockResolvedValue([]);

    render(
      await BookingsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(screen.getByText("Rezervácie zatiaľ nie sú otvorené.")).toBeDefined();
  });

  it("renders application form when catalog data exists", async () => {
    listPhotographers.mockResolvedValue([{ id: 1, name: "Anna" }]);
    listLocations.mockResolvedValue([{ id: 2, name: "Castle" }]);
    listBookableTimeslots.mockResolvedValue([
      { id: 3, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);

    render(
      await BookingsPage({ searchParams: Promise.resolve({}) }),
    );

    expect(screen.getByRole("heading", { name: "Prihláška na fotenie" })).toBeDefined();
    expect(screen.getByLabelText("E-mail")).toBeDefined();
    expect(screen.getByLabelText("Fotograf")).toBeDefined();
  });

  it("preselects photographer from query param", async () => {
    listPhotographers.mockResolvedValue([{ id: 10, name: "Betty" }]);
    listLocations.mockResolvedValue([{ id: 2, name: "Castle" }]);
    listBookableTimeslots.mockResolvedValue([
      { id: 3, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);

    render(await BookingsPage({ searchParams: Promise.resolve({ photographerId: "10" }) }));

    expect((screen.getByLabelText("Fotograf") as HTMLSelectElement).value).toBe("10");
  });
});
