import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PortfolioSlider from "./PortfolioSlider";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(
    this: HTMLDialogElement,
  ) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  });
});

describe("PortfolioSlider", () => {
  it("shows a placeholder when there are no photos", () => {
    const { container } = render(<PortfolioSlider urls={[]} name="Anna Kovář" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".photographer-cover.placeholder")).not.toBeNull();
  });

  it("shows a single image without slider controls", () => {
    render(
      <PortfolioSlider
        urls={["/catalog/photographers/anna/cover.jpg"]}
        name="Anna Kovář"
      />,
    );

    expect(screen.getByRole("img", { name: /Anna Kovář/ })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Ďalšia fotografia" })).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("shows all photos with slider controls for multiple images", () => {
    const { container } = render(
      <PortfolioSlider
        urls={[
          "/catalog/photographers/anna/cover.jpg",
          "/catalog/photographers/anna/02.jpg",
        ]}
        name="Anna Kovář"
      />,
    );

    expect(container.querySelectorAll(".portfolio-slider-track img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Predchádzajúca fotografia" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Ďalšia fotografia" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Fotografia 1" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Fotografia 2" })).toBeDefined();
  });

  it("scrolls to the selected dot", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    render(
      <PortfolioSlider
        urls={[
          "/catalog/photographers/anna/cover.jpg",
          "/catalog/photographers/anna/02.jpg",
        ]}
        name="Anna Kovář"
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Fotografia 2" }));

    expect(scrollTo).toHaveBeenCalled();
  });

  it("opens a fullscreen lightbox when a photo is clicked", () => {
    render(
      <PortfolioSlider
        urls={[
          "/catalog/photographers/anna/cover.jpg",
          "/catalog/photographers/anna/02.jpg",
        ]}
        name="Anna Kovář"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zväčšiť: Ukážka portfólia — Anna Kovář",
      }),
    );

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Portfólio — Anna Kovář" }),
    ).toBeDefined();
    expect(screen.getByText("1 / 2")).toBeDefined();
    expect(screen.getByRole("button", { name: "Zavrieť" })).toBeDefined();
  });

  it("opens lightbox for a single photo", () => {
    render(
      <PortfolioSlider
        urls={["/catalog/photographers/anna/cover.jpg"]}
        name="Anna Kovář"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zväčšiť: Ukážka portfólia — Anna Kovář",
      }),
    );

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Portfólio — Anna Kovář" }),
    ).toBeDefined();
  });

  it("uses location labels and cover styling", () => {
    render(
      <PortfolioSlider
        urls={[
          "/catalog/locations/castle/preview-01.jpg",
          "/catalog/locations/castle/preview-02.jpg",
        ]}
        name="Castle Courtyard"
        variant="location"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zväčšiť: Ukážka stanovišťa — Castle Courtyard",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Galéria — Castle Courtyard" }),
    ).toBeDefined();
  });
});
