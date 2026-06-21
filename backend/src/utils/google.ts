import { createRemoteJWKSet, jwtVerify } from "jose";

// Google's public signing keys (cached + auto-rotated by jose).
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export interface GoogleClaims {
  sub: string;
  aud?: string | string[];
  iss?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Verify a Google ID token (minted via Enoki zkLogin) against Google's JWKS,
 * enforcing the issuer. Audience is intentionally NOT hard-enforced here because
 * Enoki may issue the token through its own OAuth client (so `aud` won't match
 * the app's client id). We still return `aud` so the caller can log / soft-check
 * it. A valid signature + Google issuer proves the user owns the account.
 */
export async function verifyGoogleIdToken(token: string): Promise<GoogleClaims> {
  const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });
  return payload as unknown as GoogleClaims;
}
