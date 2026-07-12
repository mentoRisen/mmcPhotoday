import { describe, it, expect, vi, beforeEach } from "vitest";

const deleteFn = vi.fn();

vi.mock("@/db", () => ({
  db: {
    delete: (...args: unknown[]) => deleteFn(...args),
  },
}));

import { clearCatalogFromDb } from "./catalog-clear";
import { bookings, locations, persons } from "./schema";

function mockDeleteChain(affectedRows: number) {
  const where = vi.fn().mockResolvedValue([{ affectedRows }]);
  return { where };
}

describe("clearCatalogFromDb", () => {
  beforeEach(() => {
    deleteFn.mockReset();
  });

  it("deletes bookings, photographers, and locations", async () => {
    deleteFn
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockReturnValueOnce(mockDeleteChain(3))
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await clearCatalogFromDb();

    expect(result).toEqual({
      bookingsDeleted: 2,
      photographersDeleted: 3,
      locationsDeleted: 1,
    });
    expect(deleteFn).toHaveBeenCalledTimes(3);
    expect(deleteFn).toHaveBeenNthCalledWith(1, bookings);
    expect(deleteFn).toHaveBeenNthCalledWith(2, persons);
    expect(deleteFn).toHaveBeenNthCalledWith(3, locations);
  });
});
