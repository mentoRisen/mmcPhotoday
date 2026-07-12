import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getApplicationById = vi.fn();

vi.mock("@/db/applications", () => ({
  getApplicationById: (...args: unknown[]) => getApplicationById(...args),
}));

import BookingSuccessPage from "./page";

describe("booking success page", () => {
  beforeEach(() => {
    getApplicationById.mockReset();
  });

  it("shows not found message for invalid application id", async () => {
    getApplicationById.mockResolvedValue(null);

    render(
      await BookingSuccessPage({
        searchParams: Promise.resolve({ applicationId: "999" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "Prihláška nenájdená" })).toBeDefined();
  });

  it("renders summary fields when application exists", async () => {
    getApplicationById.mockResolvedValue({
      id: 10,
      status: "pending",
      createdAt: new Date(),
      cosplayerName: "Marek",
      cosplayerEmail: "marek@example.com",
      photographerName: "Anna",
      locationName: "Castle Courtyard",
      timeslotLabel: "First shoot",
      timeslotStartTime: "09:30:00",
    });

    render(
      await BookingSuccessPage({
        searchParams: Promise.resolve({ applicationId: "10" }),
      }),
    );

    expect(screen.getByText("Anna")).toBeDefined();
    expect(screen.getByText("Castle Courtyard")).toBeDefined();
    expect(screen.getByText("Čaká na schválenie")).toBeDefined();
  });
});
