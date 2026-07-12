import { describe, it, expect, vi, beforeEach } from "vitest";

const sendEmail = vi.fn();

vi.mock("./send", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import { sendPhotographerInvitationEmail } from "./photographer-invitation-emails";

describe("photographer invitation emails", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({
      messageId: "<test@example.com>",
      accepted: ["anna@example.sk"],
      rejected: [],
    });
    delete process.env.BASE_URL;
    delete process.env.CATALOG_BASE_URL;
  });

  it("sends invitation with review link and public profile", async () => {
    process.env.BASE_URL = "https://photoday.minimoviecon.sk";

    await sendPhotographerInvitationEmail({
      name: "Anna",
      email: "anna@example.sk",
      photographerId: 10,
      loginHash: "secret-hash",
    });

    expect(sendEmail).toHaveBeenCalledOnce();
    const input = sendEmail.mock.calls[0][0];
    expect(input.to).toBe("anna@example.sk");
    expect(input.subject).toContain("fotograf");
    expect(input.text).toContain("Ahoj Anna");
    expect(input.text).toContain("MMC Photoday");
    expect(input.text).toContain(
      "https://photoday.minimoviecon.sk/photographers/10?loginHash=secret-hash",
    );
    expect(input.text).toContain(
      "https://photoday.minimoviecon.sk/photographers/10",
    );
    expect(input.text).toContain("heslo");
    expect(input.html).toContain("loginHash=secret-hash");
  });
});
