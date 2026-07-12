import { sendEmail } from "./send";
import { OrganizerEmailNotConfiguredError } from "./application-emails";

export type PhotographerRegistrationEmailDetail = {
  name: string;
  email: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
  message?: string;
  submittedAt: Date;
};

function formatSubmittedAt(date: Date): string {
  return date.toLocaleString("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function optionalLine(label: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
}

function buildDetailLines(detail: PhotographerRegistrationEmailDetail): string[] {
  return [
    `Meno: ${detail.name}`,
    `E-mail: ${detail.email}`,
    optionalLine("Popis", detail.description),
    optionalLine("Instagram", detail.instagram),
    optionalLine("Facebook", detail.facebook),
    optionalLine("Twitter / X", detail.twitter),
    optionalLine("Web", detail.website),
    optionalLine("Správa", detail.message),
    `Odoslané: ${formatSubmittedAt(detail.submittedAt)}`,
  ].filter((line): line is string => line !== null);
}

export async function sendPhotographerRegistrationToOrganizer(
  detail: PhotographerRegistrationEmailDetail,
): Promise<void> {
  const organizerTo = process.env.EMAIL_ORGANIZER_TO?.trim();
  if (!organizerTo) {
    throw new OrganizerEmailNotConfiguredError();
  }

  const lines = buildDetailLines(detail);

  const text = [
    "Nová registrácia fotografa na MMC Photoday:",
    "",
    ...lines,
    "",
    "Fotografa je potrebné pridať manuálne cez import katalógu.",
  ].join("\n");

  const html = [
    "<p>Nová registrácia fotografa na MMC Photoday:</p>",
    "<ul>",
    ...lines.map((line) => `<li>${line}</li>`),
    "</ul>",
    "<p>Fotografa je potrebné pridať manuálne cez import katalógu.</p>",
  ].join("");

  await sendEmail({
    to: organizerTo,
    subject: "MMC Photoday — nová registrácia fotografa",
    text,
    html,
    replyTo: detail.email,
  });
}
