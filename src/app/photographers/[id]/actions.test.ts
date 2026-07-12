import { describe, it, expect, vi, beforeEach } from "vitest";

const isPhotographerLoginValid = vi.fn();
const confirmApplicationByPhotographer = vi.fn();
const revokeApplicationByPhotographer = vi.fn();

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
    redirect.mockClear();
  });

  it("confirmApplicationAction redirects back with login hash on success", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    confirmApplicationByPhotographer.mockResolvedValue(undefined);

    await expect(
      confirmApplicationAction(
        makeFormData({
          applicationId: "1",
          photographerId: "10",
          loginHash: "secret-hash",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/photographers/10?loginHash=secret-hash");
  });

  it("confirmApplicationAction redirects with slot_taken on conflict", async () => {
    isPhotographerLoginValid.mockResolvedValue(true);
    const { BookingConflictError } = await import("@/db/bookings");
    confirmApplicationByPhotographer.mockRejectedValue(new BookingConflictError());

    await expect(
      confirmApplicationAction(
        makeFormData({
          applicationId: "1",
          photographerId: "10",
          loginHash: "secret-hash",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/photographers/10?loginHash=secret-hash&actionError=slot_taken",
    );
  });

  it("revokeApplicationAction redirects to list when login is invalid", async () => {
    isPhotographerLoginValid.mockResolvedValue(false);

    await expect(
      revokeApplicationAction(
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
    expect(actionErrorMessage(undefined)).toBeNull();
  });
});
