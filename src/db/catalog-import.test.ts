import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LocationImport, PhotographerImport } from "@/import-catalog/types";

const select = vi.fn();
const insert = vi.fn();
const update = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
    insert: (...args: unknown[]) => insert(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

import { upsertLocation, upsertPhotographer } from "./catalog-import";

function mockSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  select.mockReturnValueOnce({ from });
  return { limit, where, from };
}

function mockInsertChain(insertId: number) {
  const values = vi.fn().mockResolvedValue([{ insertId }]);
  insert.mockReturnValueOnce({ values });
  return values;
}

function mockUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  update.mockReturnValueOnce({ set });
  return { set, where };
}

describe("upsertPhotographer", () => {
  beforeEach(() => {
    select.mockReset();
    insert.mockReset();
    update.mockReset();
  });

  const record: PhotographerImport & { portfolioUrls: string[] } = {
    name: "Anna",
    email: "anna@example.sk",
    description: "Bio",
    portfolioUrls: ["http://localhost/catalog/p.jpg"],
  };

  it("covers AE2: inserts new photographer with login hash", async () => {
    mockSelectChain([]);
    const values = mockInsertChain(5);

    const result = await upsertPhotographer(record);
    expect(result).toEqual({ action: "created", id: 5 });
    expect(insert).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        loginHash: expect.stringMatching(/^[a-f0-9]{48}$/),
      }),
    );
  });

  it("covers AE2: updates existing photographer by email", async () => {
    mockSelectChain([
      {
        id: 3,
        type: "photographer",
        email: "anna@example.sk",
        name: "Old",
        loginHash: "existing-hash",
      },
    ]);
    const { set } = mockUpdateChain();

    const result = await upsertPhotographer({
      ...record,
      description: "Updated",
      portfolioUrls: ["http://localhost/new.jpg"],
    });

    expect(result).toEqual({ action: "updated", id: 3 });
    expect(update).toHaveBeenCalledOnce();
    expect(insert).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(
      expect.not.objectContaining({ loginHash: expect.anything() }),
    );
  });

  it("sets login hash on re-import when photographer has none", async () => {
    mockSelectChain([
      {
        id: 3,
        type: "photographer",
        loginHash: null,
      },
    ]);
    const { set } = mockUpdateChain();

    await upsertPhotographer(record);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        loginHash: expect.stringMatching(/^[a-f0-9]{48}$/),
      }),
    );
  });
});

describe("upsertLocation", () => {
  beforeEach(() => {
    select.mockReset();
    insert.mockReset();
    update.mockReset();
  });

  const record: LocationImport & { previewGalleryUrls: string[] } = {
    name: "Castle Courtyard",
    previewGalleryUrls: ["http://localhost/catalog/l.jpg"],
  };

  it("inserts new location", async () => {
    mockSelectChain([]);
    mockInsertChain(7);

    const result = await upsertLocation(record);
    expect(result).toEqual({ action: "created", id: 7 });
  });

  it("updates existing location by name", async () => {
    mockSelectChain([{ id: 2, name: "Castle Courtyard" }]);
    mockUpdateChain();

    const result = await upsertLocation({
      ...record,
      previewGalleryUrls: ["http://localhost/new.jpg"],
    });

    expect(result).toEqual({ action: "updated", id: 2 });
    expect(update).toHaveBeenCalledOnce();
  });
});
