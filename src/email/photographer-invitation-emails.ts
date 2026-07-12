import { buildPhotographerReviewUrl } from "./application-emails";
import { sendEmail } from "./send";

export type PhotographerInvitationEmailDetail = {
  name: string;
  email: string;
  photographerId: number;
  loginHash: string;
};

function loadBaseUrl(): string {
  return (
    process.env.BASE_URL?.trim() ||
    process.env.CATALOG_BASE_URL?.trim() ||
    "http://localhost:3002"
  ).replace(/\/+$/, "");
}

function buildPhotographerProfileUrl(photographerId: number): string {
  return `${loadBaseUrl()}/photographers/${photographerId}`;
}

export async function sendPhotographerInvitationEmail(
  detail: PhotographerInvitationEmailDetail,
): Promise<void> {
  const reviewUrl = buildPhotographerReviewUrl(
    detail.photographerId,
    detail.loginHash,
  );
  const profileUrl = buildPhotographerProfileUrl(detail.photographerId);

  const text = [
    `Ahoj ${detail.name},`,
    "",
    "vitaj v MMC Photoday na Mini Movie Con!",
    "",
    "Si zaradený/á medzi fotografov, ku ktorým sa môžu cosplayeri prihlásiť na fotenie.",
    "Keď niekto pošle prihlášku, dostaneš e-mail s detailmi. Prihlášku potvrdíš alebo zrušíš",
    "na svojej stránke fotografa cez súkromný odkaz nižšie.",
    "",
    "Tvoj súkromný odkaz na správu prihlášok:",
    reviewUrl,
    "",
    "Ulož si ho — funguje ako heslo. Nikomu ho neposielaj.",
    "",
    "Tvoja verejná stránka v katalógu:",
    profileUrl,
    "",
    "Pri otázkach kontaktuj organizátora Mini Movie Con.",
  ].join("\n");

  const html = [
    `<p>Ahoj ${detail.name},</p>`,
    "<p>vitaj v <strong>MMC Photoday</strong> na Mini Movie Con!</p>",
    "<p>Si zaradený/á medzi fotografov, ku ktorým sa môžu cosplayeri prihlásiť na fotenie.",
    "Keď niekto pošle prihlášku, dostaneš e-mail s detailmi. Prihlášku potvrdíš alebo zrušíš",
    "na svojej stránke fotografa cez súkromný odkaz nižšie.</p>",
    "<p><strong>Tvoj súkromný odkaz na správu prihlášok:</strong><br>",
    `<a href="${reviewUrl}">${reviewUrl}</a></p>`,
    "<p>Ulož si ho — funguje ako heslo. Nikomu ho neposielaj.</p>",
    "<p><strong>Tvoja verejná stránka v katalógu:</strong><br>",
    `<a href="${profileUrl}">${profileUrl}</a></p>`,
    "<p>Pri otázkach kontaktuj organizátora Mini Movie Con.</p>",
  ].join("");

  await sendEmail({
    to: detail.email,
    subject: "MMC Photoday — tvoj prístup ako fotograf",
    text,
    html,
  });
}
