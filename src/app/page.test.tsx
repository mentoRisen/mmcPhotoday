import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("homepage", () => {
  it("renders the event title and a CTA into a placeholder route", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /Mini Movie Con/i }),
    ).toBeDefined();
    const cta = screen.getByRole("link", { name: "Rezervovať fotenie" });
    expect(cta.getAttribute("href")).toBe("/bookings");
  });
});
