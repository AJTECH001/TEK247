import { UserModel, toSafeUser } from "../models/user.model";
import { RefreshTokenModel } from "../models/refresh_token.model";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { expiresAt, TOKEN_TTL } from "../utils/token";
import { logger } from "../utils/logger";
import { SafeUser } from "../types";
import { jwtToAddress } from "@mysten/sui/zklogin";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

function buildTokens(userId: number | string, email: string, role: "user" | "admin"): AuthTokens {
  const payload = { userId, email, role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

const AuthService = {
  // ─── zkLogin ──────────────────────────────────────────────────────────────
  async getSalt(sub: string): Promise<string> {
    const user = await UserModel.findByZkLoginSub(sub);
    if (user && user.zklogin_salt) {
      return user.zklogin_salt;
    }
    // Generate a new 16-byte salt (as a decimal string for zkLogin)
    const salt = BigInt('0x' + crypto.randomBytes(16).toString('hex')).toString();
    return salt;
  },

  async zkLogin(data: {
    jwt: string;
    sub: string;
    email: string;
    fullName: string;
    suiAddress: string;
    salt: string;
  }): Promise<AuthResult> {
    // 1. Basic JWT Verification (Decode only, validation happens via Sui Address derivation)
    const decoded: any = jwt.decode(data.jwt);
    if (!decoded) throw new Error("Invalid JWT");
    
    // 2. Verify sub and email match the JWT
    if (decoded.sub !== data.sub) throw new Error("JWT subject mismatch");
    if (decoded.email !== data.email) throw new Error("JWT email mismatch");

    // 3. Verify Sui Address (Derive it on backend to be sure)
    const derivedAddress = jwtToAddress(data.jwt, data.salt, false);
    if (derivedAddress !== data.suiAddress) {
      logger.error(`Sui Address mismatch. Expected ${derivedAddress}, got ${data.suiAddress}`);
      throw new Error("Sui address verification failed");
    }

    let user = await UserModel.findByZkLoginSub(data.sub);

    if (!user) {
      // Check if email already exists
      const existingEmail = await UserModel.findByEmail(data.email);
      if (existingEmail) {
        // Link zkLogin to existing user
        user = await UserModel.updateZkLoginInfo(existingEmail.id, {
          sui_address: data.suiAddress,
          zklogin_salt: data.salt,
          zklogin_sub: data.sub
        });
      } else {
        // Create new user
        user = await UserModel.create({
          full_name: data.fullName,
          email: data.email,
          sui_address: data.suiAddress,
          zklogin_salt: data.salt,
          zklogin_sub: data.sub,
        });
      }
    }

    if (user.status !== "active") {
      throw new Error("Your account has been suspended. Please contact support.");
    }

    const tokens = buildTokens(user.id, user.email, user.role);
    await RefreshTokenModel.create(
      user.id,
      tokens.refreshToken,
      expiresAt(TOKEN_TTL.REFRESH_TOKEN)
    );

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
