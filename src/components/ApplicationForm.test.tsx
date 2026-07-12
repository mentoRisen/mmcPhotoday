import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Location, Person, Timeslot } from "@/db/schema";

const lookupCosplayerByEmail = vi.fn();
const submitApplication = vi.fn();

vi.mock("@/app/bookings/actions", () => ({
  lookupCosplayerByEmail: (...args: unknown[]) => lookupCosplayerByEmail(...args),
  submitApplication: (...args: unknown[]) => submitApplication(...args),
}));

import ApplicationForm from "./ApplicationForm";

const photographers: Person[] = [
  {
    id: 1,
    type: "photographer",
    name: "Anna",
    email: "anna@example.com",
    description: null,
    instagram: null,
    facebook: null,
    twitter: null,
    website: null,
    portfolioUrls: null,
    referenceImageUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const locations: Location[] = [
  {
    id: 2,
    name: "Castle Courtyard",
    description: null,
    address: null,
    latitude: null,
    longitude: null,
    previewGalleryUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const timeslots: Timeslot[] = [
  {
    id: 3,
    label: "First shoot",
    startTime: "09:30:00",
    bookable: true,
  },
];

describe("ApplicationForm", () => {
  beforeEach(() => {
    lookupCosplayerByEmail.mockReset();
    submitApplication.mockReset();
  });

  it("shows all fields on initial render", () => {
    render(
      <ApplicationForm
        photographers={photographers}
        locations={locations}
        timeslots={timeslots}
        confirmedKeys={[]}
      />,
    );

    expect(screen.getByLabelText("E-mail")).toBeDefined();
    expect(screen.getByLabelText("Meno")).toBeDefined();
    expect(screen.getByLabelText("Fotograf")).toBeDefined();
    expect(screen.getByLabelText("Fotostanovište")).toBeDefined();
    expect(screen.getByLabelText("Termín")).toBeDefined();
    expect(screen.getByRole("button", { name: "Odoslať prihlášku" })).toBeDefined();
  });

  it("keeps name editable for new cosplayer after email blur lookup", async () => {
    lookupCosplayerByEmail.mockResolvedValue({ found: false });

    render(
      <ApplicationForm
        photographers={photographers}
        locations={locations}
        timeslots={timeslots}
        confirmedKeys={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "new@example.com" },
    });
    fireEvent.blur(screen.getByLabelText("E-mail"));

    await waitFor(() => {
      expect(lookupCosplayerByEmail).toHaveBeenCalledWith("new@example.com");
    });
    expect((screen.getByLabelText("Meno") as HTMLInputElement).readOnly).toBe(false);
  });

  it("prefills read-only name for returning cosplayer on email blur", async () => {
    lookupCosplayerByEmail.mockResolvedValue({ found: true, name: "Marek" });

    render(
      <ApplicationForm
        photographers={photographers}
        locations={locations}
        timeslots={timeslots}
        confirmedKeys={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "marek@example.com" },
    });
    fireEvent.blur(screen.getByLabelText("E-mail"));

    await waitFor(() => {
      const nameInput = screen.getByLabelText("Meno") as HTMLInputElement;
      expect(nameInput.readOnly).toBe(true);
      expect(nameInput.value).toBe("Marek");
    });
  });

  it("preselects photographer when defaultPhotographerId is provided", () => {
    render(
      <ApplicationForm
        photographers={photographers}
        locations={locations}
        timeslots={timeslots}
        confirmedKeys={[]}
        defaultPhotographerId={1}
      />,
    );

    expect((screen.getByLabelText("Fotograf") as HTMLSelectElement).value).toBe("1");
  });
});
