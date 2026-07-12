"use server";

import { redirect } from "next/navigation";
import {
  ApplicationForbiddenError,
  ApplicationNotFoundError,
  InvalidApplicationStatusError,
  confirmApplicationByPhotographer,
  revokeApplicationByPhotographer,
} from "@/db/applications";
import { BookingConflictError } from "@/db/bookings";
import { isPhotographerLoginValid } from "@/db/photographers";

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function redirectToPhotographerPage(
  photographerId: number,
  loginHash: string,
  actionError?: string,
) {
  const params = new URLSearchParams({ loginHash });
  if (actionError) {
    params.set("actionError", actionError);
  }
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

export async function confirmApplicationAction(formData: FormData) {
  const applicationId = parsePositiveInt(formData.get("applicationId"));
  const photographerId = parsePositiveInt(formData.get("photographerId"));
  const loginHash = String(formData.get("loginHash") ?? "");

  if (!(await requirePhotographerAccess(photographerId, loginHash))) {
    redirect("/photographers");
  }

  try {
    await confirmApplicationByPhotographer(applicationId!, photographerId!);
    redirectToPhotographerPage(photographerId!, loginHash);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (error instanceof BookingConflictError) {
      redirectToPhotographerPage(
        photographerId!,
        loginHash,
        "slot_taken",
      );
    }
    if (
      error instanceof ApplicationNotFoundError ||
      error instanceof ApplicationForbiddenError ||
      error instanceof InvalidApplicationStatusError
    ) {
      redirectToPhotographerPage(
        photographerId!,
        loginHash,
        "invalid_action",
      );
    }
    console.error("Confirm application failed", error);
    redirectToPhotographerPage(photographerId!, loginHash, "unknown");
  }
}

export async function revokeApplicationAction(formData: FormData) {
  const applicationId = parsePositiveInt(formData.get("applicationId"));
  const photographerId = parsePositiveInt(formData.get("photographerId"));
  const loginHash = String(formData.get("loginHash") ?? "");

  if (!(await requirePhotographerAccess(photographerId, loginHash))) {
    redirect("/photographers");
  }

  try {
    await revokeApplicationByPhotographer(applicationId!, photographerId!);
    redirectToPhotographerPage(photographerId!, loginHash);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (
      error instanceof ApplicationNotFoundError ||
      error instanceof ApplicationForbiddenError ||
      error instanceof InvalidApplicationStatusError
    ) {
      redirectToPhotographerPage(
        photographerId!,
        loginHash,
        "invalid_action",
      );
    }
    console.error("Revoke application failed", error);
    redirectToPhotographerPage(photographerId!, loginHash, "unknown");
  }
}
