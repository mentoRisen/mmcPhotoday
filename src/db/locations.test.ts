import { describe, it, expect, vi, beforeEach } from "vitest";

const select = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

import { listLocations } from "./locations";

function mockSelectChain(rows: unknown[]) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ orderBy });
  select.mockReturnValueOnce({ from });
  return { orderBy, from };
}

describe("listLocations", () => {
  beforeEach(() => {
    select.mockReset();
  });

  it("returns location rows in the order the query yields", async () => {
    const rows = [
      { id: 1, name: "Castle Courtyard" },
      { id: 2, name: "Forest Glade" },
    ];
    const { orderBy } = mockSelectChain(rows);

    const result = await listLocations();

    expect(result).toEqual(rows);
    expect(orderBy).toHaveBeenCalledOnce();
  });

  it("returns an empty array when no locations exist", async () => {
    mockSelectChain([]);

    expect(await listLocations()).toEqual([]);
  });
});
