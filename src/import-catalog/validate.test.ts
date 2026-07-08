import { describe, it, expect } from "vitest";
import {
  validatePhotographerJson,
  validateLocationJson,
  isAllowedGalleryFilename,
} from "./validate";

describe("isAllowedGalleryFilename", () => {
  it("accepts jpg/jpeg/png", () => {
    expect(isAllowedGalleryFilename("hero.jpg")).toBe(true);
    expect(isAllowedGalleryFilename("hero.JPEG")).toBe(true);
    expect(isAllowedGalleryFilename("hero.png")).toBe(true);
  });

  it("rejects URLs and other extensions", () => {
    expect(isAllowedGalleryFilename("http://evil.com/x.jpg")).toBe(false);
    expect(isAllowedGalleryFilename("file.gif")).toBe(false);
  });
});

describe("validatePhotographerJson", () => {
  it("accepts valid photographer JSON", () => {
    const result = validatePhotographerJson({
      name: "Anna Kovář",
      email: "anna@example.sk",
      portfolio: ["not-a-url.jpg"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.portfolio).toEqual(["not-a-url.jpg"]);
    }
  });

  it("rejects missing email", () => {
    const result = validatePhotographerJson({ name: "Anna" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/email/i);
    }
  });

  it("rejects URL in portfolio", () => {
    const result = validatePhotographerJson({
      name: "Anna",
      email: "anna@example.sk",
      portfolio: ["http://evil.com/x.jpg"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects field over max length", () => {
    const result = validatePhotographerJson({
      name: "x".repeat(256),
      email: "anna@example.sk",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/name/i);
    }
  });

  it("rejects unknown top-level keys", () => {
    const result = validatePhotographerJson({
      name: "Anna",
      email: "anna@example.sk",
      extra: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unknown/i);
    }
  });
});

describe("validateLocationJson", () => {
  it("accepts valid location JSON", () => {
    const result = validateLocationJson({
      name: "Castle Courtyard",
      latitude: 48.14,
      longitude: 17.09,
      previewGallery: ["preview.jpg"],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects missing name", () => {
    const result = validateLocationJson({ description: "x" });
    expect(result.ok).toBe(false);
  });
});
