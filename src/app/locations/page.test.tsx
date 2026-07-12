import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Location } from "@/db/schema";

const listLocations = vi.fn();

vi.mock("@/db/locations", () => ({
  listLocations: (...args: unknown[]) => listLocations(...args),
}));

import LocationsPage from "./page";

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 1,
    name: "Castle Courtyard",
    description: "Historické nádvorie s kamennými múrmi.",
    address: "Hradná ulica 1, Bratislava",
    latitude: "48.1422000",
    longitude: "17.0997000",
    previewGalleryUrls: ["/catalog/locations/castle/preview-01.jpg"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("locations page", () => {
  beforeEach(() => {
    listLocations.mockReset();
  });

  it("renders a card per location in the returned order", async () => {
    listLocations.mockResolvedValue([
      makeLocation({ id: 1, name: "Castle Courtyard" }),
      makeLocation({ id: 2, name: "Forest Glade" }),
      makeLocation({ id: 3, name: "Rooftop Terrace" }),
    ]);

    render(await LocationsPage());

    expect(
      screen.getByRole("heading", { name: "Fotostanovištia" }),
    ).toBeDefined();
    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards.map((heading) => heading.textContent)).toEqual([
      "Castle Courtyard",
      "Forest Glade",
      "Rooftop Terrace",
    ]);
  });

  it("shows the Slovak empty state when no locations exist", async () => {
    listLocations.mockResolvedValue([]);

    render(await LocationsPage());

    expect(
      screen.getByText("Zoznam fotostanovišť zatiaľ nie je zverejnený."),
    ).toBeDefined();
    expect(screen.getByText(/importe katalógu/)).toBeDefined();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });
});
