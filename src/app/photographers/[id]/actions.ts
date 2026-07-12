"use server";

import { redirect } from "next/navigation";
import { actionErrorMessage } from "@/app/photographers/[id]/action-errors";
import {
  ApplicationForbiddenError,
  ApplicationNotFoundError,
  InvalidApplicationStatusError,
  confirmApplicationByPhotographer,
  revokeApplicationByPhotographer,
} from "@/db/applications";
import {
  BookingConflictError,
  NonBookableTimeslotError,
  PhotographerScheduleConflictError,
} from "@/db/bookings";
import { sendSessionConfirmationToCosplayer, sendSessionRevocationToCosplayer } from "@/email";
import { isPhotographerLoginValid } from "@/db/photographers";

export type PhotographerActionState = {
  error?: string | null;
};

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function redirectToPhotographerPage(photographerId: number, loginHash: string) {
  const params = new URLSearchParams({ loginHash });
  redirect(`/photographers/${photographerId}?${params.toString()}`);
}

async function requirePhotographerAccess(
  photographerId: number | null,
  loginHash: string,
): Promise<boolean> {
  if (!photographerId || !loginHash.trim()) {
    return false;
  }

  return isPhotographerLoginValid(photographerId, loginHash.trim());
}

export async function confirmApplicationAction(
  _prevState: PhotographerActionState,
  formData: FormData,
): Promise<PhotographerActionState> {
  const applicationId = parsePositiveInt(formData.get("applicationId"));
  const photographerId = parsePositiveInt(formData.get("photographerId"));
  const locationId = parsePositiveInt(formData.get("locationId"));
  const timeslotId = parsePositiveInt(formData.get("timeslotId"));
  const loginHash = String(formData.get("loginHash") ?? "");

  if (!(await requirePhotographerAccess(photographerId, loginHash))) {
    redirect("/photographers");
  }

  if (!locationId || !timeslotId) {
    return { error: actionErrorMessage("invalid_action") };
  }

  try {
    const detail = await confirmApplicationByPhotographer(
      applicationId!,
      photographerId!,
      { locationId: locationId!, timeslotId: timeslotId! },
    );

    try {
      await sendSessionConfirmationToCosplayer({
        cosplayerName: detail.cosplayerName,
        cosplayerEmail: detail.cosplayerEmail,
        photographerName: detail.photographerName,
        locationName: detail.locationName,
        timeslotLabel: detail.timeslotLabel,
        timeslotStartTime: detail.timeslotStartTime,
        submittedAt: detail.createdAt,
        confirmedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to send cosplayer session confirmation email", error);
    }

    redirectToPhotographerPage(photographerId!, loginHash);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    if (error instanceof BookingConflictError) {
      return { error: actionErrorMessage("slot_taken") };
    }
    if (error instanceof PhotographerScheduleConflictError) {
      return { error: actionErrorMessage("photographer_busy") };
    }
    if (error instanceof NonBookableTimeslotError) {
      return { error: actionErrorMessage("invalid_action") };
    }
    if (
      error instanceof ApplicationNotFoundError ||
      error instanceof ApplicationForbiddenError ||
      error instanceof InvalidApplicationStatusError
    ) {
      return { error: actionErrorMessage("invalid_action") };
    }
    console.error("Confirm application failed", error);
    return { error: actionErrorMessage("unknown") };
  }

  return {};
}

export async function revokeApplicationAction(
  _prevState: PhotographerActionState,
  formData: FormData,
): Promise<PhotographerActionState> {
  const applicationId = parsePositiveInt(formData.get("applicationId"));
  const photographerId = parsePositiveInt(formData.get("photographerId"));
  const loginHash = String(formData.get("loginHash") ?? "");

  if (!(await requirePhotographerAccess(photographerId, loginHash))) {
    redirect("/photographers");
  }

  try {
    const detail = await revokeApplicationByPhotographer(
      applicationId!,
      photographerId!,
    );

    try {
      await sendSessionRevocationToCosplayer({
        cosplayerName: detail.cosplayerName,
        cosplayerEmail: detail.cosplayerEmail,
        photographerName: detail.photographerName,
        locationName: detail.locationName,
        timeslotLabel: detail.timeslotLabel,
        timeslotStartTime: detail.timeslotStartTime,
        submittedAt: detail.createdAt,
        revokedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to send cosplayer session revocation email", error);
    }

    redirectToPhotographerPage(photographerId!, loginHash);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    if (
      error instanceof ApplicationNotFoundError ||
      error instanceof ApplicationForbiddenError ||
      error instanceof InvalidApplicationStatusError
    ) {
      return { error: actionErrorMessage("invalid_action") };
    }
    console.error("Revoke application failed", error);
    return { error: actionErrorMessage("unknown") };
  }

  return {};
}
