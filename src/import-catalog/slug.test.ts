import { describe, it, expect } from "vitest";
import { slugFromEmail, slugFromName } from "./slug";

describe("slugFromEmail", () => {
  it("normalizes email to slug with -at-", () => {
    expect(slugFromEmail("Anna@Example.SK")).toBe("anna-at-example-sk");
  });

  it("handles simple email", () => {
    expect(slugFromEmail("anna@example.sk")).toBe("anna-at-example-sk");
  });
});

describe("slugFromName", () => {
  it("normalizes location name", () => {
    expect(slugFromName("Castle Courtyard")).toBe("castle-courtyard");
  });

  it("trims and collapses special characters", () => {
    expect(slugFromName("  Foo--Bar!!  ")).toBe("foo-bar");
  });
});
