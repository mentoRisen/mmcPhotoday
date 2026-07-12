import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotographerProfile from "./PhotographerProfile";
import type { Person } from "@/db/schema";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  });
});

function makePhotographer(overrides: Partial<Person> = {}): Person {
  return {
    id: 1,
    type: "photographer",
    name: "Anna Kovář",
    email: "anna@example.sk",
    description: "Portréty a cosplay fotografie.",
    instagram: "https://instagram.com/anna",
    facebook: null,
    twitter: null,
    website: null,
    portfolioUrls: [
      "/catalog/photographers/anna/cover.jpg",
      "/catalog/photographers/anna/02.jpg",
    ],
    referenceImageUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("PhotographerProfile", () => {
  it("renders full description and portfolio slider", () => {
    const { container } = render(
      <PhotographerProfile photographer={makePhotographer()} />,
    );

    expect(screen.getByText("Portréty a cosplay fotografie.")).toBeDefined();
    expect(container.querySelectorAll(".portfolio-slider-track img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Ďalšia fotografia" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Instagram" })).toBeDefined();
  });

  it("never renders email", () => {
    const { container } = render(
      <PhotographerProfile photographer={makePhotographer()} />,
    );

    expect(container.textContent).not.toContain("anna@example.sk");
  });
});
