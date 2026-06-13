import { randomBytes, createHash } from "crypto";

/** Generate a cryptographically secure random hex token (64 chars) */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 hash of a token — this is what we store in the DB */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Returns a Date offset from now by the given milliseconds */
export function expiresAt(ms: number): Date {
  return new Date(Date.now() + ms);
}

export const TOKEN_TTL = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,   // 24 hours
  PASSWORD_RESET:      60 * 60 * 1000,         // 1 hour
  REFRESH_TOKEN:       30 * 24 * 60 * 60 * 1000, // 30 days
} as const;
