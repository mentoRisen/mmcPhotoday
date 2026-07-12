import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

import { findCosplayerByEmail, normalizeEmail } from "./cosplayers";

function mockSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  select.mockReturnValueOnce({ from });
  return { limit, where, from };
}

describe("cosplayers", () => {
  beforeEach(() => {
    select.mockReset();
  });

  it("normalizeEmail trims and lowercases", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });

  it("findCosplayerByEmail returns null when no row exists", async () => {
    mockSelectChain([]);
    await expect(findCosplayerByEmail("missing@example.com")).resolves.toBeNull();
  });

  it("findCosplayerByEmail returns the cosplayer row", async () => {
    const row = {
      id: 1,
      type: "cosplayer" as const,
      name: "Marek",
      email: "marek@example.com",
    };
    mockSelectChain([row]);
    await expect(findCosplayerByEmail("marek@example.com")).resolves.toEqual(row);
  });
});
