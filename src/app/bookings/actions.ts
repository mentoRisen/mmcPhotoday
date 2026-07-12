"use server";

import { redirect } from "next/navigation";
import { findCosplayerByEmail, normalizeEmail } from "@/db/cosplayers";
import { createApplication } from "@/db/applications";
import {
  BookingConflictError,
  NonBookableTimeslotError,
} from "@/db/bookings";
import {
  OrganizerEmailNotConfiguredError,
  sendApplicationConfirmationToCosplayer,
  sendApplicationNotificationToOrganizer,
  sendApplicationNotificationToPhotographer,
} from "@/email";

export type LookupCosplayerResult =
  | { found: true; name: string }
  | { found: false }
  | { error: string };

export type SubmitApplicationState = {
  error?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function lookupCosplayerByEmail(
  email: string,
): Promise<LookupCosplayerResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_PATTERN.test(normalized)) {
    return { error: "Zadaj platnú e-mailovú adresu." };
  }

  const cosplayer = await findCosplayerByEmail(normalized);
  if (!cosplayer) {
    return { found: false };
  }

  return { found: true, name: cosplayer.name };
}

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function submitApplication(
  _prevState: SubmitApplicationState,
  formData: FormData,
): Promise<SubmitApplicationState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const photographerId = parsePositiveInt(formData.get("photographerId"));
  const locationId = parsePositiveInt(formData.get("locationId"));
  const timeslotId = parsePositiveInt(formData.get("timeslotId"));

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "Zadaj platnú e-mailovú adresu." };
  }
  if (!name) {
    return { error: "Meno je povinné." };
  }
  if (!photographerId || !locationId || !timeslotId) {
    return { error: "Vyber fotografa, stanovište aj termín." };
  }

  try {
    const detail = await createApplication({
      email,
      name,
      photographerId,
      locationId,
      timeslotId,
    });

    try {
      await sendApplicationConfirmationToCosplayer({
        cosplayerName: detail.cosplayerName,
        cosplayerEmail: detail.cosplayerEmail,
        photographerName: detail.photographerName,
        locationName: detail.locationName,
        timeslotLabel: detail.timeslotLabel,
        submittedAt: detail.createdAt,
      });
    } catch (error) {
      console.error("Failed to send cosplayer confirmation email", error);
    }

    try {
      await sendApplicationNotificationToOrganizer({
        cosplayerName: detail.cosplayerName,
        cosplayerEmail: detail.cosplayerEmail,
        photographerName: detail.photographerName,
        locationName: detail.locationName,
        timeslotLabel: detail.timeslotLabel,
        submittedAt: detail.createdAt,
      });
    } catch (error) {
      if (!(error instanceof OrganizerEmailNotConfiguredError)) {
        console.error("Failed to send organizer notification email", error);
      }
    }

    try {
      await sendApplicationNotificationToPhotographer({
        cosplayerName: detail.cosplayerName,
        cosplayerEmail: detail.cosplayerEmail,
        photographerName: detail.photographerName,
        photographerId: detail.photographerId,
        photographerEmail: detail.photographerEmail,
        photographerLoginHash: detail.photographerLoginHash,
        locationName: detail.locationName,
        timeslotLabel: detail.timeslotLabel,
        submittedAt: detail.createdAt,
      });
    } catch (error) {
      console.error("Failed to send photographer notification email", error);
    }

    redirect(`/bookings/success?applicationId=${detail.id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (error instanceof NonBookableTimeslotError) {
      return { error: "Vybraný termín nie je možné rezervovať." };
    }
    if (error instanceof BookingConflictError) {
      return {
        error: "Toto stanovište a termín sú už obsadené potvrdenou rezerváciou.",
      };
    }
    console.error("Application submit failed", error);
    return { error: "Prihlášku sa nepodarilo odoslať. Skús to znova." };
  }
}
