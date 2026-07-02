import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BookingsPage from "./bookings/page";
import SessionsPage from "./sessions/page";
import NotificationsPage from "./notifications/page";

describe("placeholder pages", () => {
  it("renders the bookings heading", () => {
    render(<BookingsPage />);
    expect(
      screen.getByRole("heading", { name: "Rezervácie" }),
    ).toBeDefined();
  });

  it("renders the sessions heading", () => {
    render(<SessionsPage />);
    expect(screen.getByRole("heading", { name: "Termíny" })).toBeDefined();
  });

  it("renders the notifications heading", () => {
    render(<NotificationsPage />);
    expect(
      screen.getByRole("heading", { name: "Notifikácie" }),
    ).toBeDefined();
  });
});
