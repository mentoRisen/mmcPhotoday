import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotographerCard from "./PhotographerCard";
import type { Person } from "@/db/schema";

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
    website: "https://anna.example.sk",
    portfolioUrls: ["/catalog/photographers/anna/cover.jpg"],
    referenceImageUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("PhotographerCard", () => {
  it("covers AE1: shows name, description, cover, and only populated socials", () => {
    render(<PhotographerCard photographer={makePhotographer()} />);

    expect(
      screen.getByRole("heading", { name: "Anna Kovář" }),
    ).toBeDefined();
    expect(screen.getByText("Portréty a cosplay fotografie.")).toBeDefined();

    const cover = screen.getByRole("img", { name: /Anna Kovář/ });
    expect(cover.getAttribute("src")).toBe(
      "/catalog/photographers/anna/cover.jpg",
    );

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Instagram",
      "Web",
    ]);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("covers R12: never renders the email address", () => {
    const { container } = render(
      <PhotographerCard photographer={makePhotographer()} />,
    );
    expect(container.textContent).not.toContain("anna@example.sk");
  });

  it("covers AE2: shows a placeholder when portfolio is empty", () => {
    const { container } = render(
      <PhotographerCard
        photographer={makePhotographer({ portfolioUrls: [] })}
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".photographer-cover.placeholder")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Anna Kovář" })).toBeDefined();
  });

  it("covers R18: omits the description area when description is missing", () => {
    const { container } = render(
      <PhotographerCard photographer={makePhotographer({ description: null })} />,
    );
    expect(container.querySelector(".photographer-description")).toBeNull();
  });

  it("renders no social list when all social fields are empty", () => {
    const { container } = render(
      <PhotographerCard
        photographer={makePhotographer({
          instagram: null,
          facebook: null,
          twitter: null,
          website: null,
        })}
      />,
    );
    expect(container.querySelector(".photographer-socials")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("links cover and title to detail page when detailHref is set", () => {
    render(
      <PhotographerCard
        photographer={makePhotographer()}
        detailHref="/photographers/1"
      />,
    );

    const profileLink = screen.getByRole("link", { name: /Anna Kovář/ });
    expect(profileLink.getAttribute("href")).toBe("/photographers/1");
    expect(screen.getByText("Profil →")).toBeDefined();
    expect(screen.getByRole("link", { name: "Instagram" }).getAttribute("href")).toBe(
      "https://instagram.com/anna",
    );
  });

  it("shows a slider gallery when multiple portfolio photos exist", () => {
    const { container } = render(
      <PhotographerCard
        photographer={makePhotographer({
          portfolioUrls: [
            "/catalog/photographers/anna/cover.jpg",
            "/catalog/photographers/anna/02.jpg",
          ],
        })}
      />,
    );

    expect(container.querySelectorAll(".portfolio-slider-track img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Ďalšia fotografia" })).toBeDefined();
  });
});
