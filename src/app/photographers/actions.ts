"use server";

import { normalizeEmail } from "@/db/cosplayers";
import {
  OrganizerEmailNotConfiguredError,
  sendPhotographerRegistrationToOrganizer,
} from "@/email";

export type SubmitPhotographerRegistrationState = {
  error?: string;
  success?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalField(value: FormDataEntryValue | null): string | undefined {
  const trimmed = String(value ?? "").trim();
  return trimmed || undefined;
}

export async function submitPhotographerRegistration(
  _prevState: SubmitPhotographerRegistrationState,
  formData: FormData,
): Promise<SubmitPhotographerRegistrationState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const description = optionalField(formData.get("description"));
  const instagram = optionalField(formData.get("instagram"));
  const facebook = optionalField(formData.get("facebook"));
  const twitter = optionalField(formData.get("twitter"));
  const website = optionalField(formData.get("website"));
  const message = optionalField(formData.get("message"));

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "Zadaj platnú e-mailovú adresu." };
  }
  if (!name) {
    return { error: "Meno je povinné." };
  }

  const submittedAt = new Date();

  try {
    await sendPhotographerRegistrationToOrganizer({
      name,
      email,
      description,
      instagram,
      facebook,
      twitter,
      website,
      message,
      submittedAt,
    });
  } catch (error) {
    if (error instanceof OrganizerEmailNotConfiguredError) {
      console.error("Organizer email not configured for photographer registration");
      return {
        error:
          "Registráciu sa nepodarilo odoslať. Skús to neskôr alebo kontaktuj organizátora.",
      };
    }
    console.error("Failed to send photographer registration email", error);
    return { error: "Registráciu sa nepodarilo odoslať. Skús to znova." };
  }

  return { success: true };
}
