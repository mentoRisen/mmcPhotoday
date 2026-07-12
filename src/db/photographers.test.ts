import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

import { listPhotographers, getPhotographerById, isPhotographerLoginValid } from "./photographers";

function mockSelectChain(rows: unknown[]) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  select.mockReturnValueOnce({ from });
  return { orderBy, where, from };
}

describe("listPhotographers", () => {
  beforeEach(() => {
    select.mockReset();
  });

  it("covers R5/R6: returns photographer rows in the order the query yields", async () => {
    const rows = [
      { id: 1, type: "photographer", name: "Anna" },
      { id: 2, type: "photographer", name: "Boris" },
    ];
    const { where, orderBy } = mockSelectChain(rows);

    const result = await listPhotographers();

    expect(result).toEqual(rows);
    expect(where).toHaveBeenCalledOnce();
    expect(orderBy).toHaveBeenCalledOnce();
  });

  it("returns an empty array when no photographers exist", async () => {
    mockSelectChain([]);

    expect(await listPhotographers()).toEqual([]);
  });
});

describe("getPhotographerById", () => {
  beforeEach(() => {
    select.mockReset();
  });

  it("returns a photographer row when found", async () => {
    const row = { id: 5, type: "photographer", name: "Anna" };
    const limit = vi.fn().mockResolvedValue([row]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValueOnce({ from });

    await expect(getPhotographerById(5)).resolves.toEqual(row);
  });

  it("returns null when no row matches", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValueOnce({ from });

    await expect(getPhotographerById(99)).resolves.toBeNull();
  });
});

describe("isPhotographerLoginValid", () => {
  beforeEach(() => {
    select.mockReset();
  });

  it("returns true when login hash matches", async () => {
    const limit = vi.fn().mockResolvedValue([
      { id: 5, type: "photographer", name: "Anna", loginHash: "abc123" },
    ]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValueOnce({ from });

    await expect(isPhotographerLoginValid(5, "abc123")).resolves.toBe(true);
  });

  it("returns false when login hash does not match", async () => {
    const limit = vi.fn().mockResolvedValue([
      { id: 5, type: "photographer", name: "Anna", loginHash: "abc123" },
    ]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    select.mockReturnValueOnce({ from });

    await expect(isPhotographerLoginValid(5, "wrong")).resolves.toBe(false);
  });
});
