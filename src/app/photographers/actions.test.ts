import { describe, it, expect, vi, beforeEach } from "vitest";

const sendPhotographerRegistrationToOrganizer = vi.fn();

vi.mock("@/db/cosplayers", () => ({
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
}));

vi.mock("@/email", () => ({
  sendPhotographerRegistrationToOrganizer: (...args: unknown[]) =>
    sendPhotographerRegistrationToOrganizer(...args),
  OrganizerEmailNotConfiguredError: class OrganizerEmailNotConfiguredError extends Error {},
}));

import { submitPhotographerRegistration } from "./actions";

describe("photographers actions", () => {
  beforeEach(() => {
    sendPhotographerRegistrationToOrganizer.mockReset();
    sendPhotographerRegistrationToOrganizer.mockResolvedValue(undefined);
  });

  it("validates missing name", async () => {
    const formData = new FormData();
    formData.set("email", "anna@example.sk");
    formData.set("name", "");

    await expect(submitPhotographerRegistration({}, formData)).resolves.toEqual({
      error: "Meno je povinné.",
    });
    expect(sendPhotographerRegistrationToOrganizer).not.toHaveBeenCalled();
  });

  it("validates invalid email", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("name", "Anna");

    await expect(submitPhotographerRegistration({}, formData)).resolves.toEqual({
      error: "Zadaj platnú e-mailovú adresu.",
    });
  });

  it("sends registration email and returns success", async () => {
    const formData = new FormData();
    formData.set("email", "anna@example.sk");
    formData.set("name", "Anna Kovář");
    formData.set("description", "Cosplay portréty");
    formData.set("instagram", "https://instagram.com/anna");

    await expect(submitPhotographerRegistration({}, formData)).resolves.toEqual({
      success: true,
    });

    expect(sendPhotographerRegistrationToOrganizer).toHaveBeenCalledOnce();
    const detail = sendPhotographerRegistrationToOrganizer.mock.calls[0][0];
    expect(detail.name).toBe("Anna Kovář");
    expect(detail.email).toBe("anna@example.sk");
    expect(detail.description).toBe("Cosplay portréty");
    expect(detail.instagram).toBe("https://instagram.com/anna");
    expect(detail.submittedAt).toBeInstanceOf(Date);
  });

  it("returns error when email send fails", async () => {
    sendPhotographerRegistrationToOrganizer.mockRejectedValue(new Error("SMTP down"));

    const formData = new FormData();
    formData.set("email", "anna@example.sk");
    formData.set("name", "Anna");

    await expect(submitPhotographerRegistration({}, formData)).resolves.toEqual({
      error: "Registráciu sa nepodarilo odoslať. Skús to znova.",
    });
  });
});
