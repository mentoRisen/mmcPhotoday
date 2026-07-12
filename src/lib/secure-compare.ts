import { timingSafeEqual } from "node:crypto";

/** Constant-time string comparison for login secrets. */
export function secureCompare(provided: string, expected: string): boolean {
  if (!provided || !expected || provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
