import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Person } from "@/db/schema";

const listPhotographers = vi.fn();

vi.mock("@/db/photographers", () => ({
  listPhotographers: (...args: unknown[]) => listPhotographers(...args),
}));

vi.mock("@/components/PhotographerRegistrationForm", () => ({
  default: () => <div data-testid="photographer-registration-form" />,
}));

import PhotographersPage from "./page";

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
    portfolioUrls: ["/catalog/photographers/anna/cover.jpg"],
    referenceImageUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("photographers page", () => {
  beforeEach(() => {
    listPhotographers.mockReset();
  });

  it("covers AE1: renders a card per photographer in the returned order", async () => {
    listPhotographers.mockResolvedValue([
      makePhotographer({ id: 1, name: "Anna Kovář" }),
      makePhotographer({ id: 2, name: "Boris Malý" }),
      makePhotographer({ id: 3, name: "Cyril Novák" }),
    ]);

    render(await PhotographersPage());

    expect(screen.getByRole("heading", { name: "Fotografi" })).toBeDefined();
    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards.map((heading) => heading.textContent)).toEqual([
      "Anna Kovář",
      "Boris Malý",
      "Cyril Novák",
    ]);
    expect(screen.getAllByRole("link", { name: /Profil/ })).toHaveLength(3);
  });

  it("covers AE3: shows the Slovak empty state when no photographers exist", async () => {
    listPhotographers.mockResolvedValue([]);

    render(await PhotographersPage());

    expect(
      screen.getByText("Zoznam fotografov zatiaľ nie je zverejnený."),
    ).toBeDefined();
    expect(
      screen.getByText(/importe katalógu/),
    ).toBeDefined();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });

  it("covers R12: page never renders photographer emails", async () => {
    listPhotographers.mockResolvedValue([makePhotographer()]);

    const { container } = render(await PhotographersPage());

    expect(container.textContent).not.toContain("anna@example.sk");
  });

  it("renders photographer registration section", async () => {
    listPhotographers.mockResolvedValue([]);

    render(await PhotographersPage());

    expect(screen.getByRole("heading", { name: "Chceš fotiť na Photoday?" })).toBeDefined();
    expect(screen.getByTestId("photographer-registration-form")).toBeDefined();
  });
});
