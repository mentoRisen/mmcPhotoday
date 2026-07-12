import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sendPhotographerInvitationEmail } from "@/email/photographer-invitation-emails";
import { getPhotographerById, listPhotographers } from "./photographers";
import { persons } from "./schema";

export type SendInvitationResult =
  | {
      status: "sent";
      photographerId: number;
      name: string;
      email: string;
    }
  | {
      status: "dry_run";
      photographerId: number;
      name: string;
      email: string;
    }
  | {
      status: "skipped";
      photographerId: number;
      name: string;
      reason: string;
    }
  | {
      status: "failed";
      photographerId: number;
      name: string;
      error: string;
    };

export type SendInvitationOptions = {
  force?: boolean;
  dryRun?: boolean;
};

async function markPhotographerInvitationSent(id: number): Promise<void> {
  await db
    .update(persons)
    .set({ invitationSentAt: new Date() })
    .where(eq(persons.id, id));
}

export async function sendPhotographerInvitationById(
  photographerId: number,
  options: SendInvitationOptions = {},
): Promise<SendInvitationResult> {
  const photographer = await getPhotographerById(photographerId);
  if (!photographer) {
    return {
      status: "failed",
      photographerId,
      name: `#${photographerId}`,
      error: "Photographer not found",
    };
  }

  const name = photographer.name;
  const email = photographer.email.trim();

  if (!email) {
    return {
      status: "skipped",
      photographerId,
      name,
      reason: "missing email",
    };
  }

  if (!photographer.loginHash) {
    return {
      status: "skipped",
      photographerId,
      name,
      reason: "missing login hash",
    };
  }

  if (photographer.invitationSentAt && !options.force) {
    return {
      status: "skipped",
      photographerId,
      name,
      reason: "invitation already sent",
    };
  }

  if (options.dryRun) {
    return {
      status: "dry_run",
      photographerId,
      name,
      email,
    };
  }

  try {
    await sendPhotographerInvitationEmail({
      name,
      email,
      photographerId: photographer.id,
      loginHash: photographer.loginHash,
    });
    await markPhotographerInvitationSent(photographer.id);
    return {
      status: "sent",
      photographerId,
      name,
      email,
    };
  } catch (error) {
    return {
      status: "failed",
      photographerId,
      name,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendPhotographerInvitationsToAll(
  options: SendInvitationOptions = {},
): Promise<SendInvitationResult[]> {
  const photographers = await listPhotographers();
  const results: SendInvitationResult[] = [];

  for (const photographer of photographers) {
    results.push(await sendPhotographerInvitationById(photographer.id, options));
  }

  return results;
}
