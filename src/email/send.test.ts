import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMail = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}));

import { sendEmail, applyTestingRedirect } from "./send";

const testConfig = {
  host: "smtp.example.com",
  port: 587,
  secure: false,
  user: "user@example.com",
  pass: "secret",
  from: "MMC Photoday <noreply@minimoviecon.sk>",
};

describe("sendEmail", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({
      messageId: "<test@example.com>",
      accepted: ["recipient@example.com"],
      rejected: [],
    });
  });

  it("sends a plain-text email with default from address", async () => {
    const result = await sendEmail(
      {
        to: "recipient@example.com",
        subject: "Test",
        text: "Hello",
      },
      { config: testConfig },
    );

    expect(sendMail).toHaveBeenCalledWith({
      from: testConfig.from,
      to: "recipient@example.com",
      subject: "Test",
      text: "Hello",
      html: undefined,
      replyTo: undefined,
    });
    expect(result.messageId).toBe("<test@example.com>");
    expect(result.accepted).toEqual(["recipient@example.com"]);
  });

  it("allows overriding from and replyTo", async () => {
    await sendEmail(
      {
        to: ["a@example.com", "b@example.com"],
        subject: "Booking confirmed",
        html: "<p>Confirmed</p>",
        from: "custom@example.com",
        replyTo: "support@example.com",
      },
      { config: testConfig },
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "custom@example.com",
        replyTo: "support@example.com",
        html: "<p>Confirmed</p>",
      }),
    );
  });

  it("requires at least one of text or html", async () => {
    await expect(
      sendEmail(
        {
          to: "recipient@example.com",
          subject: "Empty body",
        },
        { config: testConfig },
      ),
    ).rejects.toThrow(/text or html/i);
  });

  it("redirects to EMAIL_TESTING_TO and prepends a testing banner", async () => {
    process.env.EMAIL_TESTING_TO = "lukas.zemcak@gmail.com";

    await sendEmail(
      {
        to: "cosplayer@example.com",
        subject: "Booking confirmed",
        text: "Your session is booked.",
        html: "<p>Your session is booked.</p>",
      },
      { config: testConfig },
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "lukas.zemcak@gmail.com",
        text: expect.stringContaining(
          "[TESTING] This is a testing email. Original recipient (to): cosplayer@example.com",
        ),
        html: expect.stringContaining(
          "[TESTING]</strong> This is a testing email. Original recipient (to): cosplayer@example.com",
        ),
      }),
    );

    delete process.env.EMAIL_TESTING_TO;
  });
});

describe("applyTestingRedirect", () => {
  afterEach(() => {
    delete process.env.EMAIL_TESTING_TO;
  });

  it("returns input unchanged when EMAIL_TESTING_TO is unset", () => {
    const input = {
      to: "a@example.com",
      subject: "Hi",
      text: "Hello",
    };

    expect(applyTestingRedirect(input)).toEqual(input);
  });

  it("lists multiple original recipients in the banner", () => {
    process.env.EMAIL_TESTING_TO = "tester@example.com";

    const result = applyTestingRedirect({
      to: ["a@example.com", "b@example.com"],
      subject: "Hi",
      text: "Hello",
    });

    expect(result.to).toBe("tester@example.com");
    expect(result.text).toContain("a@example.com, b@example.com");
  });
});
