import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Person } from "@/db/schema";

const getPhotographerById = vi.fn();
const listApplicationsForPhotographer = vi.fn();
const listLocations = vi.fn();
const listBookableTimeslots = vi.fn();
const isPhotographerLoginValid = vi.fn();

vi.mock("@/db/locations", () => ({
  listLocations: (...args: unknown[]) => listLocations(...args),
}));

vi.mock("@/db/timeslots", () => ({
  listBookableTimeslots: (...args: unknown[]) => listBookableTimeslots(...args),
}));

vi.mock("@/db/photographers", () => ({
  getPhotographerById: (...args: unknown[]) => getPhotographerById(...args),
  isPhotographerLoginValid: (...args: unknown[]) =>
    isPhotographerLoginValid(...args),
}));

vi.mock("@/db/applications", () => ({
  listApplicationsForPhotographer: (...args: unknown[]) =>
    listApplicationsForPhotographer(...args),
}));

import PhotographerDetailPage, { generateMetadata } from "./page";

function makePhotographer(overrides: Partial<Person> = {}): Person {
  return {
    id: 10,
    type: "photographer",
    name: "Betty Višváderová",
    email: "betty@example.sk",
    description: "Portréty a cosplay fotografie.",
    instagram: "https://instagram.com/betty",
    facebook: null,
    twitter: null,
    website: null,
    portfolioUrls: [
      "/catalog/photographers/betty/cover.jpg",
      "/catalog/photographers/betty/02.jpg",
    ],
    referenceImageUrls: null,
    loginHash: "secret-hash",
    createdAt: new Date("2026-07-01T10:00:00Z"),
    updatedAt: new Date("2026-07-01T10:00:00Z"),
    ...overrides,
  };
}

describe("photographer detail page", () => {
  beforeEach(() => {
    getPhotographerById.mockReset();
    listApplicationsForPhotographer.mockReset();
    listLocations.mockReset();
    listBookableTimeslots.mockReset();
    isPhotographerLoginValid.mockReset();
    isPhotographerLoginValid.mockResolvedValue(false);
    listLocations.mockResolvedValue([{ id: 1, name: "Castle" }]);
    listBookableTimeslots.mockResolvedValue([
      { id: 2, label: "Second shoot", startTime: "11:00:00", bookable: true },
    ]);
  });

  it("renders profile and applications for a valid photographer", async () => {
    getPhotographerById.mockResolvedValue(makePhotographer());
    listApplicationsForPhotographer.mockResolvedValue([
      {
        id: 1,
        status: "pending",
        createdAt: new Date("2026-07-11T09:00:00Z"),
        cosplayerName: "Test Cosplayer",
        locationId: 1,
        locationName: "Námestie Majstra Pavla",
        timeslotId: 2,
        timeslotLabel: "Second shoot",
        timeslotStartTime: "11:00:00",
      },
    ]);

    render(
      await PhotographerDetailPage({
        params: Promise.resolve({ id: "10" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Betty Višváderová", level: 1 }),
    ).toBeDefined();
    expect(screen.getByText("Portréty a cosplay fotografie.")).toBeDefined();
    expect(screen.getByText("Test Cosplayer")).toBeDefined();
    expect(screen.getByText("Námestie Majstra Pavla")).toBeDefined();
    expect(screen.getByRole("link", { name: /Späť na zoznam fotografov/ }).getAttribute("href")).toBe(
      "/photographers",
    );
    expect(screen.getByRole("link", { name: "Rezervovať fotenie" }).getAttribute("href")).toBe(
      "/bookings?photographerId=10",
    );
    expect(
      screen.getByText(
        "Chceš sa odfotiť u Betty Višváderová? Pošli prihlášku cez formulár rezervácií.",
      ),
    ).toBeDefined();
  });

  it("shows not found state for invalid id", async () => {
    render(
      await PhotographerDetailPage({
        params: Promise.resolve({ id: "abc" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole("heading", { name: "Fotograf nenájdený" })).toBeDefined();
    expect(getPhotographerById).not.toHaveBeenCalled();
  });

  it("shows not found state when photographer is missing", async () => {
    getPhotographerById.mockResolvedValue(null);

    render(
      await PhotographerDetailPage({
        params: Promise.resolve({ id: "99" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole("heading", { name: "Fotograf nenájdený" })).toBeDefined();
  });

  it("generateMetadata uses photographer name", async () => {
    getPhotographerById.mockResolvedValue(makePhotographer());

    await expect(
      generateMetadata({ params: Promise.resolve({ id: "10" }) }),
    ).resolves.toEqual({ title: "Betty Višváderová — MMC Photoday" });
  });

  it("never renders photographer email", async () => {
    getPhotographerById.mockResolvedValue(makePhotographer());
    listApplicationsForPhotographer.mockResolvedValue([]);

    const { container } = render(
      await PhotographerDetailPage({
        params: Promise.resolve({ id: "10" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(container.textContent).not.toContain("betty@example.sk");
  });

  it("shows management UI when login hash is valid", async () => {
    getPhotographerById.mockResolvedValue(makePhotographer());
    listApplicationsForPhotographer.mockResolvedValue([
      {
        id: 1,
        status: "pending",
        createdAt: new Date("2026-07-11T09:00:00Z"),
        cosplayerName: "Test Cosplayer",
        locationId: 1,
        locationName: "Námestie Majstra Pavla",
        timeslotId: 2,
        timeslotLabel: "Second shoot",
        timeslotStartTime: "11:00:00",
      },
    ]);
    isPhotographerLoginValid.mockResolvedValue(true);

    const { container } = render(
      await PhotographerDetailPage({
        params: Promise.resolve({ id: "10" }),
        searchParams: Promise.resolve({ loginHash: "secret-hash" }),
      }),
    );

    expect(
      screen.getByText("Si prihlásený ako fotograf — môžeš potvrdzovať alebo rušiť prihlášky."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Potvrdiť prihlášku" })).toBeDefined();
    expect(container.textContent).not.toContain("secret-hash");
  });
});
