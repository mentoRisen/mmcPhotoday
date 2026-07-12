import { describe, it, expect, vi, beforeEach } from "vitest";

const findCosplayerByEmail = vi.fn();
const createApplication = vi.fn();
const sendApplicationConfirmationToCosplayer = vi.fn();
const sendApplicationNotificationToOrganizer = vi.fn();
const sendApplicationNotificationToPhotographer = vi.fn();
const redirect = vi.fn();

vi.mock("@/db/cosplayers", () => ({
  findCosplayerByEmail: (...args: unknown[]) => findCosplayerByEmail(...args),
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
}));

vi.mock("@/db/applications", () => ({
  createApplication: (...args: unknown[]) => createApplication(...args),
}));

vi.mock("@/email", () => ({
  sendApplicationConfirmationToCosplayer: (...args: unknown[]) =>
    sendApplicationConfirmationToCosplayer(...args),
  sendApplicationNotificationToOrganizer: (...args: unknown[]) =>
    sendApplicationNotificationToOrganizer(...args),
  sendApplicationNotificationToPhotographer: (...args: unknown[]) =>
    sendApplicationNotificationToPhotographer(...args),
  OrganizerEmailNotConfiguredError: class OrganizerEmailNotConfiguredError extends Error {},
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import { lookupCosplayerByEmail, submitApplication } from "./actions";

describe("bookings actions", () => {
  beforeEach(() => {
    findCosplayerByEmail.mockReset();
    createApplication.mockReset();
    sendApplicationConfirmationToCosplayer.mockReset();
    sendApplicationNotificationToOrganizer.mockReset();
    sendApplicationNotificationToPhotographer.mockReset();
    redirect.mockReset();
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("lookup returns found with name for existing cosplayer", async () => {
    findCosplayerByEmail.mockResolvedValue({
      id: 1,
      name: "Marek",
      email: "marek@example.com",
    });

    await expect(lookupCosplayerByEmail("marek@example.com")).resolves.toEqual({
      found: true,
      name: "Marek",
    });
  });

  it("lookup returns not found for unknown email", async () => {
    findCosplayerByEmail.mockResolvedValue(null);

    await expect(lookupCosplayerByEmail("new@example.com")).resolves.toEqual({
      found: false,
    });
  });

  it("submit validates missing name for new cosplayer flow", async () => {
    const formData = new FormData();
    formData.set("email", "new@example.com");
    formData.set("name", "");
    formData.set("photographerId", "1");
    formData.set("locationId", "2");
    formData.set("timeslotId", "3");

    await expect(submitApplication({}, formData)).resolves.toEqual({
      error: "Meno je povinné.",
    });
  });

  it("successful submit sends emails and redirects", async () => {
    createApplication.mockResolvedValue({
      id: 10,
      cosplayerName: "Marek",
      cosplayerEmail: "marek@example.com",
      photographerId: 1,
      photographerName: "Anna",
      photographerEmail: "anna@example.sk",
      photographerLoginHash: "secret-hash",
      locationName: "Castle",
      timeslotLabel: "First shoot",
      createdAt: new Date("2026-07-11T09:00:00Z"),
    });

    const formData = new FormData();
    formData.set("email", "marek@example.com");
    formData.set("name", "Marek");
    formData.set("photographerId", "1");
    formData.set("locationId", "2");
    formData.set("timeslotId", "3");

    await expect(submitApplication({}, formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(sendApplicationConfirmationToCosplayer).toHaveBeenCalledOnce();
    expect(sendApplicationNotificationToOrganizer).toHaveBeenCalledOnce();
    expect(sendApplicationNotificationToPhotographer).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/bookings/success?applicationId=10");
  });
});
