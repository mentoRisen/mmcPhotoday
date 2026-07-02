import { describe, it, expect, vi, beforeEach } from "vitest";

const execute = vi.fn();

vi.mock("@/db", () => ({
  db: {
    execute: (...args: unknown[]) => execute(...args),
  },
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("returns 200 and db: up when the query succeeds", async () => {
    execute.mockResolvedValueOnce([[{ "1": 1 }]]);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok", db: "up" });
  });

  it("returns 503 and db: down when the query throws", async () => {
    execute.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ status: "error", db: "down" });
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
  });
});
