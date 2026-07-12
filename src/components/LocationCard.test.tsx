import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LocationCard from "./LocationCard";
import type { Location } from "@/db/schema";

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

describe("LocationCard", () => {
  it("shows name, description, cover, address, and map link", () => {
    render(<LocationCard location={makeLocation()} />);

    expect(
      screen.getByRole("heading", { name: "Castle Courtyard" }),
    ).toBeDefined();
    expect(
      screen.getByText("Historické nádvorie s kamennými múrmi."),
    ).toBeDefined();
    expect(screen.getByText("Hradná ulica 1, Bratislava")).toBeDefined();

    const cover = screen.getByRole("img", { name: /Castle Courtyard/ });
    expect(cover.getAttribute("src")).toBe(
      "/catalog/locations/castle/preview-01.jpg",
    );

    const mapLink = screen.getByRole("link", { name: "Mapa" });
    expect(mapLink.getAttribute("href")).toBe(
      "https://www.google.com/maps?q=48.1422000,17.0997000",
    );
    expect(mapLink.getAttribute("target")).toBe("_blank");
    expect(mapLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows a placeholder when preview gallery is empty", () => {
    const { container } = render(
      <LocationCard location={makeLocation({ previewGalleryUrls: [] })} />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".location-cover.placeholder")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Castle Courtyard" }),
    ).toBeDefined();
  });

  it("omits the description area when description is missing", () => {
    const { container } = render(
      <LocationCard location={makeLocation({ description: null })} />,
    );
    expect(container.querySelector(".location-description")).toBeNull();
  });

  it("renders no meta section when address and coordinates are missing", () => {
    const { container } = render(
      <LocationCard
        location={makeLocation({
          address: null,
          latitude: null,
          longitude: null,
        })}
      />,
    );
    expect(container.querySelector(".location-meta")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows a slider gallery when multiple preview photos exist", () => {
    const { container } = render(
      <LocationCard
        location={makeLocation({
          previewGalleryUrls: [
            "/catalog/locations/castle/preview-01.jpg",
            "/catalog/locations/castle/preview-02.jpg",
          ],
        })}
      />,
    );

    expect(container.querySelectorAll(".portfolio-slider-track img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Ďalšia fotografia" })).toBeDefined();
  });
});
