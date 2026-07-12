import { describe, it, expect } from "vitest";
import { secureCompare } from "./secure-compare";

describe("secureCompare", () => {
  it("returns true for matching strings", () => {
    expect(secureCompare("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(secureCompare("abc123", "abc124")).toBe(false);
  });

  it("returns false when lengths differ", () => {
    expect(secureCompare("short", "longer-value")).toBe(false);
  });

  it("returns false for empty values", () => {
    expect(secureCompare("", "abc")).toBe(false);
  });
});
