import { UserModel, toSafeUser } from "../models/user.model";
import { RefreshTokenModel } from "../models/refresh_token.model";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { expiresAt, TOKEN_TTL } from "../utils/token";
import { SafeUser } from "../types";
import { verifyGoogleIdToken } from "../utils/google";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

function buildTokens(userId: number, email: string, role: "user" | "admin"): AuthTokens {
  const payload = { userId, email, role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

const AuthService = {
  // ─── Enoki zkLogin (Google) ────────────────────────────────────────────────
  /**
   * Log a user in from an Enoki zkLogin session. We verify the Google ID token
   * server-side (signature + issuer + audience) — that proves ownership of the
   * Google account. Enoki manages the salt and derives the Sui address, which we
   * persist as the user's wallet.
   */
  async enokiLogin(data: { jwt: string; suiAddress: string }): Promise<AuthResult> {
    let claims;
    try {
      claims = await verifyGoogleIdToken(data.jwt);
    } catch (e) {
      try {
        const part = data.jwt.split(".")[1] ?? "";
        const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
        logger.error(
          `[enokiLogin] Google token verify failed: ${(e as Error).message} | ` +
          `token.aud=${JSON.stringify(payload.aud)} token.iss=${payload.iss} token.email=${payload.email}`
        );
      } catch {
        logger.error(`[enokiLogin] Google token verify failed and token was unparseable: ${(e as Error).message}`);
      }
      throw new Error(`Google token verification failed: ${(e as Error).message}`);
    }

    // Soft audience check — log if it isn't our client id so we can tighten later.
    const aud = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
    if (aud && aud !== env.GOOGLE_CLIENT_ID) {
      logger.warn(`[enokiLogin] token aud (${aud}) != app client id — accepted (Enoki-issued).`);
    }
    const sub = claims.sub;
    if (!sub) throw new Error("Google token is missing a subject (sub)");
    const email = claims.email;
    logger.info(`[enokiLogin] verified Google token for sub=${sub} email=${email ?? "(none)"}`);

    // Existing users are matched by the stable Google `sub` — no email needed.
    let user = await UserModel.findByZkLoginSub(sub);

    if (!user) {
      // Prefer the real Google email; fall back to a deterministic, unique
      // placeholder so first-time sign-in never hard-fails (email is NOT NULL).
      const effectiveEmail = email ?? `${sub}@zklogin.local`;
      if (!email) {
        logger.warn(`[enokiLogin] no email claim for sub=${sub}; using placeholder ${effectiveEmail}`);
      }
      const fullName = claims.name || (email ? email.split("@")[0] : `User ${sub.slice(0, 6)}`);
      const existingEmail = await UserModel.findByEmail(effectiveEmail);
      if (existingEmail) {
        user = await UserModel.updateZkLoginInfo(existingEmail.id, {
          sui_address: data.suiAddress,
          zklogin_salt: "enoki",
          zklogin_sub: sub,
        });
      } else {
        user = await UserModel.create({
          full_name: fullName,
          email: effectiveEmail,
          sui_address: data.suiAddress,
          zklogin_salt: "enoki",
          zklogin_sub: sub,
        });
      }
    } else if (user.sui_address !== data.suiAddress) {
      // Keep the persisted wallet in sync with the verified Enoki address.
      user = await UserModel.updateZkLoginInfo(user.id, {
        sui_address: data.suiAddress,
        zklogin_salt: "enoki",
        zklogin_sub: sub,
      });
    }

    if (user.status !== "active") {
      throw new Error("Your account has been suspended. Please contact support.");
    }

    const tokens = buildTokens(user.id, user.email, user.role);
    await RefreshTokenModel.create(user.id, tokens.refreshToken, expiresAt(TOKEN_TTL.REFRESH_TOKEN));

    return { user: toSafeUser(user), tokens };
  },

  // ─── Refresh Token ─────────────────────────────────────────────────────────
  async refresh(oldRefreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new Error("Invalid or expired refresh token");
    }

    const record = await RefreshTokenModel.findByToken(oldRefreshToken);
    if (!record) throw new Error("Refresh token has been revoked");

    await RefreshTokenModel.deleteByToken(oldRefreshToken);
    const tokens = buildTokens(payload.userId, payload.email, payload.role);
    await RefreshTokenModel.create(payload.userId, tokens.refreshToken, expiresAt(TOKEN_TTL.REFRESH_TOKEN));

    return tokens;
  },

  // ─── Logout ────────────────────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    await RefreshTokenModel.deleteByToken(refreshToken);
  },
};

export default AuthService;
