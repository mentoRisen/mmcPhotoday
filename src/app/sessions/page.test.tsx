import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const listLocations = vi.fn();
const listBookableTimeslots = vi.fn();
const listConfirmedSessions = vi.fn();

vi.mock("@/db/locations", () => ({
  listLocations: (...args: unknown[]) => listLocations(...args),
}));

vi.mock("@/db/timeslots", () => ({
  listBookableTimeslots: (...args: unknown[]) => listBookableTimeslots(...args),
}));

vi.mock("@/db/applications", () => ({
  listConfirmedSessions: (...args: unknown[]) => listConfirmedSessions(...args),
  confirmedSessionKey: (locationId: number, timeslotId: number) =>
    `${locationId}:${timeslotId}`,
}));

import SessionsPage from "./page";

describe("sessions page", () => {
  beforeEach(() => {
    listLocations.mockReset();
    listBookableTimeslots.mockReset();
    listConfirmedSessions.mockReset();
    listConfirmedSessions.mockResolvedValue([]);
  });

  it("renders heading and updated lead copy without placeholder badge", async () => {
    listLocations.mockResolvedValue([{ id: 1, name: "Castle" }]);
    listBookableTimeslots.mockResolvedValue([
      { id: 10, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);

    render(await SessionsPage());

    expect(screen.getByRole("heading", { name: "Termíny" })).toBeDefined();
    expect(
      screen.getByText(/Prehľad potvrdených fotení podľa stanovišťa a času/),
    ).toBeDefined();
    expect(screen.queryByText("Pripravuje sa")).toBeNull();
  });

  it("renders schedule matrix when catalog data exists", async () => {
    listLocations.mockResolvedValue([{ id: 1, name: "Castle" }]);
    listBookableTimeslots.mockResolvedValue([
      { id: 10, label: "First shoot", startTime: "09:30:00", bookable: true },
    ]);
    listConfirmedSessions.mockResolvedValue([
      {
        id: 5,
        cosplayerName: "Mia",
        photographerId: 10,
        photographerName: "Betty",
        locationId: 1,
        locationName: "Castle",
        timeslotId: 10,
        timeslotLabel: "First shoot",
        timeslotStartTime: "09:30:00",
      },
    ]);

    render(await SessionsPage());

    expect(screen.getByText("Mia")).toBeDefined();
    expect(screen.getByRole("link", { name: "Betty" })).toBeDefined();
  });

  it("shows catalog empty state when locations or timeslots are missing", async () => {
    listLocations.mockResolvedValue([]);
    listBookableTimeslots.mockResolvedValue([]);

    render(await SessionsPage());

    expect(screen.getByText("Rozvrh zatiaľ nie je k dispozícii.")).toBeDefined();
  });
});
