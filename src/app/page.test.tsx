import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import SiteNav from "@/components/SiteNav";

describe("homepage", () => {
  it("renders the event title and a CTA into a placeholder route", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /^Photoday$/i })).toBeDefined();
    const cta = screen.getByRole("link", { name: "Rezervovať fotenie" });
    expect(cta.getAttribute("href")).toBe("/bookings");
  });

  it("covers R4: links to /photographers from the photographers feature card", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: "Spoznať fotografov" });
    expect(link.getAttribute("href")).toBe("/photographers");
  });
});

describe("site navigation", () => {
  it("covers R3: includes a Slovak nav link to /photographers", () => {
    render(<SiteNav />);
    const link = screen.getByRole("link", { name: "Fotografi" });
    expect(link.getAttribute("href")).toBe("/photographers");
  });
});
