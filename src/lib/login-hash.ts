import { randomBytes } from "node:crypto";

export function createLoginHash(): string {
  return randomBytes(24).toString("hex");
}
