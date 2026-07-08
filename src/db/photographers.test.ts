import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

import { listPhotographers } from "./photographers";

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
