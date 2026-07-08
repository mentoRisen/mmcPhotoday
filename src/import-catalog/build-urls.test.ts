import { describe, it, expect } from "vitest";
import { buildGalleryUrls } from "./build-urls";

describe("buildGalleryUrls", () => {
  it("strips trailing slash from base URL", () => {
    const urls = buildGalleryUrls(
      "http://localhost:3002/",
      "photographers",
      "test-slug",
      ["hero.jpg"],
    );
    expect(urls).toEqual([
      "http://localhost:3002/catalog/photographers/test-slug/hero.jpg",
    ]);
  });

  it("namespaces URLs by slug", () => {
    const a = buildGalleryUrls(
      "http://localhost:3002",
      "photographers",
      "slug-a",
      ["hero.jpg"],
    );
    const b = buildGalleryUrls(
      "http://localhost:3002",
      "photographers",
      "slug-b",
      ["hero.jpg"],
    );
    expect(a[0]).not.toEqual(b[0]);
  });
});
