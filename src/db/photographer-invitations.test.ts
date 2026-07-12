import { describe, it, expect, vi, beforeEach } from "vitest";

const getPhotographerById = vi.fn();
const listPhotographers = vi.fn();
const sendPhotographerInvitationEmail = vi.fn();
const update = vi.fn();

vi.mock("./photographers", () => ({
  getPhotographerById: (...args: unknown[]) => getPhotographerById(...args),
  listPhotographers: (...args: unknown[]) => listPhotographers(...args),
}));

vi.mock("@/email/photographer-invitation-emails", () => ({
  sendPhotographerInvitationEmail: (...args: unknown[]) =>
    sendPhotographerInvitationEmail(...args),
}));

vi.mock("@/db", () => ({
  db: {
    update: (...args: unknown[]) => update(...args),
  },
}));

import {
  sendPhotographerInvitationById,
  sendPhotographerInvitationsToAll,
} from "./photographer-invitations";

function mockUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  update.mockReturnValueOnce({ set });
  return { set, where };
}

const photographer = {
  id: 10,
  type: "photographer" as const,
  name: "Anna",
  email: "anna@example.sk",
  description: null,
  instagram: null,
  facebook: null,
  twitter: null,
  website: null,
  portfolioUrls: [],
  referenceImageUrls: null,
  loginHash: "secret-hash",
  invitationSentAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("photographer invitations", () => {
  beforeEach(() => {
    getPhotographerById.mockReset();
    listPhotographers.mockReset();
    sendPhotographerInvitationEmail.mockReset();
    update.mockReset();
    sendPhotographerInvitationEmail.mockResolvedValue(undefined);
  });

  it("sends invitation and marks invitationSentAt", async () => {
    getPhotographerById.mockResolvedValue(photographer);
    const { set } = mockUpdateChain();

    const result = await sendPhotographerInvitationById(10);

    expect(result).toEqual({
      status: "sent",
      photographerId: 10,
      name: "Anna",
      email: "anna@example.sk",
    });
    expect(sendPhotographerInvitationEmail).toHaveBeenCalledWith({
      name: "Anna",
      email: "anna@example.sk",
      photographerId: 10,
      loginHash: "secret-hash",
    });
    expect(set).toHaveBeenCalledWith({ invitationSentAt: expect.any(Date) });
  });

  it("skips when invitation was already sent", async () => {
    getPhotographerById.mockResolvedValue({
      ...photographer,
      invitationSentAt: new Date("2026-07-01T10:00:00Z"),
    });

    const result = await sendPhotographerInvitationById(10);

    expect(result.status).toBe("skipped");
    expect(result).toMatchObject({
      reason: "invitation already sent",
    });
    expect(sendPhotographerInvitationEmail).not.toHaveBeenCalled();
  });

  it("re-sends when force is true", async () => {
    getPhotographerById.mockResolvedValue({
      ...photographer,
      invitationSentAt: new Date("2026-07-01T10:00:00Z"),
    });
    mockUpdateChain();

    const result = await sendPhotographerInvitationById(10, { force: true });

    expect(result.status).toBe("sent");
    expect(sendPhotographerInvitationEmail).toHaveBeenCalledOnce();
  });

  it("returns dry_run without sending", async () => {
    getPhotographerById.mockResolvedValue(photographer);

    const result = await sendPhotographerInvitationById(10, { dryRun: true });

    expect(result).toEqual({
      status: "dry_run",
      photographerId: 10,
      name: "Anna",
      email: "anna@example.sk",
    });
    expect(sendPhotographerInvitationEmail).not.toHaveBeenCalled();
  });

  it("sendPhotographerInvitationsToAll processes every photographer", async () => {
    listPhotographers.mockResolvedValue([
      photographer,
      { ...photographer, id: 11, name: "Boris", email: "boris@example.sk" },
    ]);
    getPhotographerById
      .mockResolvedValueOnce(photographer)
      .mockResolvedValueOnce({
        ...photographer,
        id: 11,
        name: "Boris",
        email: "boris@example.sk",
      });
    mockUpdateChain();
    mockUpdateChain();

    const results = await sendPhotographerInvitationsToAll();

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.status === "sent")).toBe(true);
  });
});
