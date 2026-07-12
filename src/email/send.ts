import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  loadEmailTestingAllowlist,
  loadEmailTestingTo,
  loadSmtpConfig,
  normalizeRecipientEmail,
} from "./config";
import type { EmailAddress, SendEmailInput, SendEmailResult, SmtpConfig } from "./types";

function formatOriginalRecipients(to: EmailAddress | EmailAddress[]): string {
  return Array.isArray(to) ? to.join(", ") : to;
}

function recipientsBypassTestingRedirect(
  to: EmailAddress | EmailAddress[],
  allowlist: Set<string>,
): boolean {
  if (allowlist.size === 0) {
    return false;
  }

  const recipients = Array.isArray(to) ? to : [to];
  return recipients.every((recipient) =>
    allowlist.has(normalizeRecipientEmail(recipient)),
  );
}

export function applyTestingRedirect(input: SendEmailInput): SendEmailInput {
  const testingTo = loadEmailTestingTo();
  if (!testingTo) {
    return input;
  }

  const allowlist = loadEmailTestingAllowlist();
  if (recipientsBypassTestingRedirect(input.to, allowlist)) {
    return input;
  }

  const originalTo = formatOriginalRecipients(input.to);
  const textBanner = `[TESTING] This is a testing email. Original recipient (to): ${originalTo}`;
  const htmlBanner = `<p><strong>[TESTING]</strong> This is a testing email. Original recipient (to): ${originalTo}</p>`;

  return {
    ...input,
    to: testingTo,
    text: input.text ? `${textBanner}\n\n${input.text}` : undefined,
    html: input.html ? `${htmlBanner}\n${input.html}` : undefined,
  };
}

let cachedTransporter: Transporter | undefined;

function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
  });
}

function getTransporter(config?: SmtpConfig): Transporter {
  if (config) {
    return createTransporter(config);
  }

  cachedTransporter ??= createTransporter(loadSmtpConfig());
  return cachedTransporter;
}

export async function sendEmail(
  input: SendEmailInput,
  options?: { config?: SmtpConfig; transporter?: Transporter },
): Promise<SendEmailResult> {
  const redirected = applyTestingRedirect(input);
  const { to, subject, text, html, from, replyTo } = redirected;

  if (!text && !html) {
    throw new Error("sendEmail requires at least one of text or html.");
  }

  const config = options?.config ?? loadSmtpConfig();
  const transporter = options?.transporter ?? getTransporter(config);

  const info = await transporter.sendMail({
    from: from ?? config.from,
    to,
    subject,
    text,
    html,
    replyTo,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted.map(String),
    rejected: info.rejected.map(String),
  };
}
