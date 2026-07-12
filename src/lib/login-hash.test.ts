import { describe, it, expect } from "vitest";
import { createLoginHash } from "./login-hash";

describe("createLoginHash", () => {
  it("returns a 48-character hex string", () => {
    expect(createLoginHash()).toMatch(/^[a-f0-9]{48}$/);
  });

  it("generates unique values", () => {
    expect(createLoginHash()).not.toBe(createLoginHash());
  });
});
