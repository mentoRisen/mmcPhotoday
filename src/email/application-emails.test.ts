import { describe, it, expect, vi, beforeEach } from "vitest";

const sendEmail = vi.fn();

vi.mock("./send", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import {
  OrganizerEmailNotConfiguredError,
  buildPhotographerReviewUrl,
  sendApplicationConfirmationToCosplayer,
  sendApplicationNotificationToOrganizer,
  sendApplicationNotificationToPhotographer,
} from "./application-emails";

const detail = {
  cosplayerName: "Marek",
  cosplayerEmail: "marek@example.com",
  photographerName: "Anna",
  locationName: "Castle Courtyard",
  timeslotLabel: "First shoot",
  submittedAt: new Date("2026-07-11T09:30:00Z"),
};

const photographerDetail = {
  ...detail,
  photographerId: 10,
  photographerEmail: "anna@example.sk",
  photographerLoginHash: "secret-hash",
};

describe("application emails", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({
      messageId: "<test@example.com>",
      accepted: ["marek@example.com"],
      rejected: [],
    });
    delete process.env.EMAIL_ORGANIZER_TO;
    delete process.env.BASE_URL;
    delete process.env.CATALOG_BASE_URL;
  });

  it("cosplayer email includes summary fields and pending wording", async () => {
    await sendApplicationConfirmationToCosplayer(detail);

    expect(sendEmail).toHaveBeenCalledOnce();
    const input = sendEmail.mock.calls[0][0];
    expect(input.to).toBe("marek@example.com");
    expect(input.text).toContain("Anna");
    expect(input.text).toContain("Castle Courtyard");
    expect(input.text).toContain("čaká na schválenie");
  });

  it("organizer email includes cosplayer contact and session choices", async () => {
    process.env.EMAIL_ORGANIZER_TO = "organizer@example.com";

    await sendApplicationNotificationToOrganizer(detail);

    const input = sendEmail.mock.calls[0][0];
    expect(input.to).toBe("organizer@example.com");
    expect(input.text).toContain("marek@example.com");
    expect(input.text).toContain("First shoot");
  });

  it("organizer send throws when EMAIL_ORGANIZER_TO is unset", async () => {
    await expect(sendApplicationNotificationToOrganizer(detail)).rejects.toBeInstanceOf(
      OrganizerEmailNotConfiguredError,
    );
  });

  it("photographer email includes application summary and review link", async () => {
    process.env.BASE_URL = "https://photoday.minimoviecon.sk";

    await sendApplicationNotificationToPhotographer(photographerDetail);

    const input = sendEmail.mock.calls[0][0];
    expect(input.to).toBe("anna@example.sk");
    expect(input.text).toContain("marek@example.com");
    expect(input.text).toContain("Castle Courtyard");
    expect(input.text).toContain(
      "https://photoday.minimoviecon.sk/photographers/10?loginHash=secret-hash",
    );
    expect(input.html).toContain("loginHash=secret-hash");
  });

  it("photographer email omits review link when login hash is missing", async () => {
    await sendApplicationNotificationToPhotographer({
      ...photographerDetail,
      photographerLoginHash: null,
    });

    const input = sendEmail.mock.calls[0][0];
    expect(input.text).toContain("kontaktuj organizátora");
    expect(input.text).not.toContain("/photographers/");
  });

  it("buildPhotographerReviewUrl encodes login hash", () => {
    process.env.BASE_URL = "https://photoday.minimoviecon.sk/";

    expect(buildPhotographerReviewUrl(10, "abc+def")).toBe(
      "https://photoday.minimoviecon.sk/photographers/10?loginHash=abc%2Bdef",
    );
  });
});
