import { describe, it, expect, afterEach } from "vitest";
import { loadSmtpConfig } from "./config";

const ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
] as const;

describe("loadSmtpConfig", () => {
  const original: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });

  function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
    for (const key of ENV_KEYS) {
      original[key] ??= process.env[key];
      delete process.env[key];
    }
    for (const [key, value] of Object.entries(values)) {
      process.env[key] = value;
    }
  }

  it("loads a complete SMTP configuration", () => {
    setEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "user@example.com",
      SMTP_PASS: "secret",
      EMAIL_FROM: "Test <test@example.com>",
    });

    expect(loadSmtpConfig()).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "user@example.com",
      pass: "secret",
      from: "Test <test@example.com>",
    });
  });

  it("defaults secure to true on port 465", () => {
    setEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      EMAIL_FROM: "Test <test@example.com>",
    });

    expect(loadSmtpConfig().secure).toBe(true);
  });

  it("requires SMTP_HOST", () => {
    setEnv({
      SMTP_PORT: "587",
      EMAIL_FROM: "Test <test@example.com>",
    });

    expect(() => loadSmtpConfig()).toThrow(/SMTP_HOST/i);
  });

  it("requires SMTP_USER and SMTP_PASS together", () => {
    setEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "user@example.com",
      EMAIL_FROM: "Test <test@example.com>",
    });

    expect(() => loadSmtpConfig()).toThrow(/SMTP_USER and SMTP_PASS/i);
  });
});
