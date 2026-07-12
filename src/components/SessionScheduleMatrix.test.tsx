import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionScheduleMatrix from "./SessionScheduleMatrix";
import { confirmedSessionKey } from "@/db/applications";

const locations = [
  { id: 1, name: "Castle" },
  { id: 2, name: "Square" },
];

const timeslots = [
  { id: 10, label: "First shoot", startTime: "09:30:00", bookable: true },
  { id: 11, label: "Second shoot", startTime: "11:00:00", bookable: true },
];

describe("SessionScheduleMatrix", () => {
  it("covers AE1: renders full grid with dashes and empty-state message", () => {
    render(
      <SessionScheduleMatrix
        locations={locations}
        timeslots={timeslots}
        sessionsByKey={{}}
      />,
    );

    expect(
      screen.getByText("Zatiaľ nie sú potvrdené žiadne fotenia."),
    ).toBeDefined();
    expect(screen.getByRole("rowheader", { name: "Castle" })).toBeDefined();
    expect(screen.getByRole("rowheader", { name: "Square" })).toBeDefined();
    expect(screen.getByText("First shoot (09:30)")).toBeDefined();
    expect(screen.getByText("Second shoot (11:00)")).toBeDefined();
    expect(screen.getAllByText("—").length).toBe(4);
  });

  it("covers AE2: renders confirmed session in matching cell", () => {
    const key = confirmedSessionKey(1, 11);

    render(
      <SessionScheduleMatrix
        locations={locations}
        timeslots={timeslots}
        sessionsByKey={{
          [key]: {
            id: 5,
            cosplayerName: "Mia",
            photographerId: 10,
            photographerName: "Betty",
            locationId: 1,
            locationName: "Castle",
            timeslotId: 11,
            timeslotLabel: "Second shoot",
            timeslotStartTime: "11:00:00",
          },
        }}
      />,
    );

    expect(screen.getByText("Mia")).toBeDefined();
    const bettyLink = screen.getByRole("link", { name: "Betty" });
    expect(bettyLink.getAttribute("href")).toBe("/photographers/10");
    expect(screen.getAllByText("—").length).toBe(3);
  });

  it("covers AE3: missing session in map shows dash", () => {
    render(
      <SessionScheduleMatrix
        locations={locations}
        timeslots={timeslots}
        sessionsByKey={{}}
      />,
    );

    expect(screen.queryByText("Pending Cosplayer")).toBeNull();
    expect(screen.getAllByText("—").length).toBe(4);
  });
});
