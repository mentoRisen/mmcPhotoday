import { describe, it, expect, vi, beforeEach } from "vitest";

const isPhotographerLoginValid = vi.fn();
const confirmApplicationByPhotographer = vi.fn();
const revokeApplicationByPhotographer = vi.fn();
const sendSessionConfirmationToCosplayer = vi.fn();
const sendSessionRevocationToCosplayer = vi.fn();

vi.mock("@/db/photographers", () => ({
  isPhotographerLoginValid: (...args: unknown[]) =>
    isPhotographerLoginValid(...args),
}));

vi.mock("@/db/applications", () => ({
  ApplicationForbiddenError: class ApplicationForbiddenError extends Error {},
  ApplicationNotFoundError: class ApplicationNotFoundError extends Error {},
  InvalidApplicationStatusError: class InvalidApplicationStatusError extends Error {},
  confirmApplicationByPhotographer: (...args: unknown[]) =>
    confirmApplicationByPhotographer(...args),
  revokeApplicationByPhotographer: (...args: unknown[]) =>
    revokeApplicationByPhotographer(...args),
}));

vi.mock("@/db/bookings", () => ({
  BookingConflictError: class BookingConflictError extends Error {},
  NonBookableTimeslotError: class NonBookableTimeslotError extends Error {},
  PhotographerScheduleConflictError: class PhotographerScheduleConflictError extends Error {},
}));

vi.mock("@/email", () => ({
  sendSessionConfirmationToCosplayer: (...args: unknown[]) =>
    sendSessionConfirmationToCosplayer(...args),
  sendSessionRevocationToCosplayer: (...args: unknown[]) =>
    sendSessionRevocationToCosplayer(...args),
}));

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

import { actionErrorMessage } from "./action-errors";
import {
  confirmApplicationAction,
  revokeApplicationAction,
} from "./actions";

function makeFormData(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("photographer detail actions", () => {
  beforeEach(() => {
    isPhotographerLoginValid.mockReset();
    confirmApplicationByPhotographer.mockReset();
    revokeApplicationByPhotographer.mockReset();
    sendSessionConfirmationToCosplayer.mockReset();
    sendSessionRevocationToCosplayer.mockReset();
    redirect.mockClear();
  });

  it("confirmApplicationAction redirects back with login hash on success", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    confirmApplicationByPhotographer.mockResolvedValue({
      cosplayerName: "Anna",
      cosplayerEmail: "anna@example.com",
      photographerName: "Betty",
      locationName: "Castle",
      timeslotLabel: "First shoot",
      timeslotStartTime: "09:30:00",
      createdAt: new Date("2026-07-11T09:00:00Z"),
    });
    sendSessionConfirmationToCosplayer.mockResolvedValue(undefined);

    await expect(
      confirmApplicationAction(
        {},
        makeFormData({
          applicationId: "1",
          photographerId: "10",
          locationId: "8",
          timeslotId: "3",
          loginHash: "secret-hash",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/photographers/10?loginHash=secret-hash");

    expect(sendSessionConfirmationToCosplayer).toHaveBeenCalledOnce();
  });

  it("confirmApplicationAction returns slot_taken error on conflict", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    const { BookingConflictError } = await import("@/db/bookings");
    confirmApplicationByPhotographer.mockRejectedValue(new BookingConflictError());

    await expect(
      confirmApplicationAction(
        {},
        makeFormData({
          applicationId: "1",
          photographerId: "10",
          locationId: "8",
          timeslotId: "3",
          loginHash: "secret-hash",
        }),
      ),
    ).resolves.toEqual({
      error: actionErrorMessage("slot_taken"),
    });
  });

  it("confirmApplicationAction returns photographer_busy on schedule conflict", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    const { PhotographerScheduleConflictError } = await import("@/db/bookings");
    confirmApplicationByPhotographer.mockRejectedValue(
      new PhotographerScheduleConflictError(),
    );

    await expect(
      confirmApplicationAction(
        {},
        makeFormData({
          applicationId: "1",
          photographerId: "10",
          locationId: "8",
          timeslotId: "3",
          loginHash: "secret-hash",
        }),
      ),
    ).resolves.toEqual({
      error: actionErrorMessage("photographer_busy"),
    });
  });

  it("confirmApplicationAction returns invalid_action for non-bookable timeslot", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    const { NonBookableTimeslotError } = await import("@/db/bookings");
    confirmApplicationByPhotographer.mockRejectedValue(
      new NonBookableTimeslotError(),
    );

    await expect(
      confirmApplicationAction(
        {},
        makeFormData({
          applicationId: "1",
          photographerId: "10",
          locationId: "8",
          timeslotId: "3",
          loginHash: "secret-hash",
        }),
      ),
    ).resolves.toEqual({
      error: actionErrorMessage("invalid_action"),
    });
  });

  it("revokeApplicationAction sends revocation email and redirects on success", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    revokeApplicationByPhotographer.mockResolvedValue({
      cosplayerName: "Anna",
      cosplayerEmail: "anna@example.com",
      photographerName: "Betty",
      locationName: "Castle",
      timeslotLabel: "First shoot",
      timeslotStartTime: "09:30:00",
      createdAt: new Date("2026-07-11T09:00:00Z"),
    });
    sendSessionRevocationToCosplayer.mockResolvedValue(undefined);

    await expect(
      revokeApplicationAction(
        {},
        makeFormData({
          applicationId: "2",
          photographerId: "10",
          loginHash: "secret-hash",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/photographers/10?loginHash=secret-hash");

    expect(sendSessionRevocationToCosplayer).toHaveBeenCalledOnce();
  });

  it("revokeApplicationAction redirects to list when login is invalid", async () => {
    isPhotographerLoginValid.mockResolvedValue(false);

    await expect(
      revokeApplicationAction(
        {},
        makeFormData({
          applicationId: "2",
          photographerId: "10",
          loginHash: "bad-hash",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/photographers");
  });

  it("actionErrorMessage maps known codes", () => {
    expect(actionErrorMessage("slot_taken")).toContain("obsadené");
    expect(actionErrorMessage("photographer_busy")).toContain("potvrdené");
    expect(actionErrorMessage(undefined)).toBeNull();
  });
});
