import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotographerApplicationList from "./PhotographerApplicationList";

describe("PhotographerApplicationList", () => {
  it("shows empty state when there are no applications", () => {
    render(<PhotographerApplicationList applications={[]} />);

    expect(screen.getByText("Zatiaľ žiadne prihlášky.")).toBeDefined();
  });

  it("renders application rows with status and details", () => {
    render(
      <PhotographerApplicationList
        applications={[
          {
            id: 1,
            status: "pending",
            createdAt: new Date("2026-07-11T09:00:00Z"),
            cosplayerName: "Anna Cos",
            locationName: "Castle",
            timeslotLabel: "First shoot",
            timeslotStartTime: "09:30:00",
          },
          {
            id: 2,
            status: "confirmed",
            createdAt: new Date("2026-07-10T12:00:00Z"),
            cosplayerName: "Boris Hero",
            locationName: "Square",
            timeslotLabel: "Second shoot",
            timeslotStartTime: "11:00:00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Anna Cos")).toBeDefined();
    expect(screen.getByText("Boris Hero")).toBeDefined();
    expect(screen.getByText("Čaká na schválenie")).toBeDefined();
    expect(screen.getByText("Potvrdené")).toBeDefined();
    expect(screen.getByText("First shoot (09:30)")).toBeDefined();
    expect(screen.getByText("Second shoot (11:00)")).toBeDefined();
  });

  it("shows confirm and revoke buttons when management is enabled", () => {
    render(
      <PhotographerApplicationList
        applications={[
          {
            id: 1,
            status: "pending",
            createdAt: new Date("2026-07-11T09:00:00Z"),
            cosplayerName: "Anna Cos",
            locationName: "Castle",
            timeslotLabel: "First shoot",
            timeslotStartTime: "09:30:00",
          },
          {
            id: 2,
            status: "confirmed",
            createdAt: new Date("2026-07-10T12:00:00Z"),
            cosplayerName: "Boris Hero",
            locationName: "Square",
            timeslotLabel: "Second shoot",
            timeslotStartTime: "11:00:00",
          },
        ]}
        canManage
        photographerId={10}
        loginHash="secret-hash"
      />,
    );

    expect(screen.getByRole("button", { name: "Potvrdiť prihlášku" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Zrušiť potvrdenie" })).toBeDefined();
  });
});
