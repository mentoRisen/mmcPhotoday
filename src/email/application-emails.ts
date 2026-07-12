import { sendEmail } from "./send";

export type ApplicationEmailDetail = {
  cosplayerName: string;
  cosplayerEmail: string;
  photographerName: string;
  locationName: string;
  timeslotLabel: string;
  submittedAt: Date;
};

export type PhotographerApplicationEmailDetail = ApplicationEmailDetail & {
  photographerId: number;
  photographerEmail: string;
  photographerLoginHash: string | null;
};

export class OrganizerEmailNotConfiguredError extends Error {
  constructor() {
    super("EMAIL_ORGANIZER_TO is not configured");
    this.name = "OrganizerEmailNotConfiguredError";
  }
}

function formatSubmittedAt(date: Date): string {
  return date.toLocaleString("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function loadBaseUrl(): string {
  return (
    process.env.BASE_URL?.trim() ||
    process.env.CATALOG_BASE_URL?.trim() ||
    "http://localhost:3002"
  ).replace(/\/+$/, "");
}

export function buildPhotographerReviewUrl(
  photographerId: number,
  loginHash: string,
): string {
  const params = new URLSearchParams({ loginHash });
  return `${loadBaseUrl()}/photographers/${photographerId}?${params.toString()}`;
}

function buildSummaryLines(detail: ApplicationEmailDetail): string[] {
  return [
    `Fotograf: ${detail.photographerName}`,
    `Stanovište: ${detail.locationName}`,
    `Termín: ${detail.timeslotLabel}`,
    `Odoslané: ${formatSubmittedAt(detail.submittedAt)}`,
  ];
}

export async function sendApplicationConfirmationToCosplayer(
  detail: ApplicationEmailDetail,
): Promise<void> {
  const lines = buildSummaryLines(detail);
  const text = [
    `Ahoj ${detail.cosplayerName},`,
    "",
    "tvoja prihláška na fotenie na MMC Photoday bola prijatá a čaká na schválenie organizátorom.",
    "",
    ...lines,
    "",
    "Stav: čaká na schválenie",
  ].join("\n");

  const html = [
    `<p>Ahoj ${detail.cosplayerName},</p>`,
    "<p>tvoja prihláška na fotenie na MMC Photoday bola prijatá a čaká na schválenie organizátorom.</p>",
    "<ul>",
    ...lines.map((line) => `<li>${line}</li>`),
    "</ul>",
    "<p><strong>Stav:</strong> čaká na schválenie</p>",
  ].join("");

  await sendEmail({
    to: detail.cosplayerEmail,
    subject: "MMC Photoday — prihláška prijatá",
    text,
    html,
  });
}

export async function sendApplicationNotificationToOrganizer(
  detail: ApplicationEmailDetail,
): Promise<void> {
  const organizerTo = process.env.EMAIL_ORGANIZER_TO?.trim();
  if (!organizerTo) {
    throw new OrganizerEmailNotConfiguredError();
  }

  const lines = [
    `Cosplayer: ${detail.cosplayerName} (${detail.cosplayerEmail})`,
    ...buildSummaryLines(detail),
  ];

  const text = [
    "Nová prihláška na fotenie na MMC Photoday:",
    "",
    ...lines,
    "",
    "Stav: čaká na schválenie",
  ].join("\n");

  const html = [
    "<p>Nová prihláška na fotenie na MMC Photoday:</p>",
    "<ul>",
    ...lines.map((line) => `<li>${line}</li>`),
    "</ul>",
    "<p><strong>Stav:</strong> čaká na schválenie</p>",
  ].join("");

  await sendEmail({
    to: organizerTo,
    subject: "MMC Photoday — nová prihláška cosplayera",
    text,
    html,
  });
}

export async function sendApplicationNotificationToPhotographer(
  detail: PhotographerApplicationEmailDetail,
): Promise<void> {
  const lines = [
    `Cosplayer: ${detail.cosplayerName} (${detail.cosplayerEmail})`,
    `Stanovište: ${detail.locationName}`,
    `Termín: ${detail.timeslotLabel}`,
    `Odoslané: ${formatSubmittedAt(detail.submittedAt)}`,
  ];

  const reviewUrl =
    detail.photographerLoginHash &&
    buildPhotographerReviewUrl(
      detail.photographerId,
      detail.photographerLoginHash,
    );

  const text = [
    `Ahoj ${detail.photographerName},`,
    "",
    "máš novú prihlášku na fotenie na MMC Photoday.",
    "",
    ...lines,
    "",
    ...(reviewUrl
      ? [
          "Prihlášku môžeš potvrdiť alebo zrušiť na svojej stránke fotografa:",
          reviewUrl,
        ]
      : [
          "Odkaz na správu prihlášok zatiaľ nie je k dispozícii — kontaktuj organizátora.",
        ]),
    "",
    "Stav: čaká na potvrdenie",
  ].join("\n");

  const html = [
    `<p>Ahoj ${detail.photographerName},</p>`,
    "<p>máš novú prihlášku na fotenie na MMC Photoday.</p>",
    "<ul>",
    ...lines.map((line) => `<li>${line}</li>`),
    "</ul>",
    ...(reviewUrl
      ? [
          "<p>Prihlášku môžeš potvrdiť alebo zrušiť na svojej stránke fotografa:</p>",
          `<p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
        ]
      : [
          "<p>Odkaz na správu prihlášok zatiaľ nie je k dispozícii — kontaktuj organizátora.</p>",
        ]),
    "<p><strong>Stav:</strong> čaká na potvrdenie</p>",
  ].join("");

  await sendEmail({
    to: detail.photographerEmail,
    subject: "MMC Photoday — nová prihláška cosplayera",
    text,
    html,
  });
}
