import type { SmtpConfig } from "./types";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and configure SMTP.`,
    );
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function parsePort(raw: string): number {
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`SMTP_PORT must be a positive integer (got "${raw}").`);
  }
  return port;
}

function parseSecure(raw: string | undefined, port: number): boolean {
  if (raw === undefined) {
    return port === 465;
  }
  return raw === "1" || raw.toLowerCase() === "true";
}

export function loadSmtpConfig(): SmtpConfig {
  const host = requireEnv("SMTP_HOST");
  const port = parsePort(requireEnv("SMTP_PORT"));
  const secure = parseSecure(optionalEnv("SMTP_SECURE"), port);
  const user = optionalEnv("SMTP_USER");
  const pass = optionalEnv("SMTP_PASS");
  const from = requireEnv("EMAIL_FROM");

  if ((user && !pass) || (!user && pass)) {
    throw new Error(
      "SMTP_USER and SMTP_PASS must both be set, or both omitted for unauthenticated SMTP.",
    );
  }

  return { host, port, secure, user, pass, from };
}

export function normalizeRecipientEmail(address: string): string {
  const trimmed = address.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match ? match[1] : trimmed).trim().toLowerCase();
}

export function loadEmailTestingTo(): string | undefined {
  return optionalEnv("EMAIL_TESTING_TO");
}

/** Comma-separated addresses that receive mail normally when EMAIL_TESTING_TO is set. */
export function loadEmailTestingAllowlist(): Set<string> {
  const raw = optionalEnv("EMAIL_TESTING_ALLOWLIST");
  if (!raw) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((entry) => normalizeRecipientEmail(entry))
      .filter(Boolean),
  );
}
