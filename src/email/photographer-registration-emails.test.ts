import { describe, it, expect, vi, beforeEach } from "vitest";

const sendEmail = vi.fn();

vi.mock("./send", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import { OrganizerEmailNotConfiguredError } from "./application-emails";
import { sendPhotographerRegistrationToOrganizer } from "./photographer-registration-emails";

const detail = {
  name: "Anna Kovář",
  email: "anna@example.sk",
  description: "Portréty a cosplay fotografie.",
  instagram: "https://instagram.com/anna",
  website: "https://anna.example.sk",
  submittedAt: new Date("2026-07-11T09:30:00Z"),
};

describe("photographer registration emails", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({
      messageId: "<test@example.com>",
      accepted: ["organizer@example.com"],
      rejected: [],
    });
    delete process.env.EMAIL_ORGANIZER_TO;
  });

  it("sends registration details to organizer with reply-to set to applicant", async () => {
    process.env.EMAIL_ORGANIZER_TO = "organizer@example.com";

    await sendPhotographerRegistrationToOrganizer(detail);

    expect(sendEmail).toHaveBeenCalledOnce();
    const input = sendEmail.mock.calls[0][0];
    expect(input.to).toBe("organizer@example.com");
    expect(input.replyTo).toBe("anna@example.sk");
    expect(input.subject).toContain("registrácia fotografa");
    expect(input.text).toContain("Anna Kovář");
    expect(input.text).toContain("anna@example.sk");
    expect(input.text).toContain("import katalógu");
  });

  it("omits empty optional fields from the email body", async () => {
    process.env.EMAIL_ORGANIZER_TO = "organizer@example.com";

    await sendPhotographerRegistrationToOrganizer({
      name: "Boris",
      email: "boris@example.sk",
      submittedAt: new Date("2026-07-11T09:30:00Z"),
    });

    const input = sendEmail.mock.calls[0][0];
    expect(input.text).toContain("Boris");
    expect(input.text).not.toContain("Instagram:");
    expect(input.text).not.toContain("Správa:");
  });

  it("throws when EMAIL_ORGANIZER_TO is unset", async () => {
    await expect(
      sendPhotographerRegistrationToOrganizer(detail),
    ).rejects.toBeInstanceOf(OrganizerEmailNotConfiguredError);
  });
});
