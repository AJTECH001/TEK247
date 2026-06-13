import { query } from "../config/database";
import { RefreshTokenRow } from "../types";
import { hashToken } from "../utils/token";

export const RefreshTokenModel = {
  async create(userId: number, token: string, expiresAt: Date): Promise<void> {
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, hashToken(token), expiresAt]
    );
  },

  async findByToken(token: string): Promise<RefreshTokenRow | null> {
    const rows = await query<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)]
    );
    return rows[0] ?? null;
  },

  /** Remove a single refresh token (logout from one device) */
  async deleteByToken(token: string): Promise<void> {
    await query(
      "DELETE FROM refresh_tokens WHERE token_hash = $1",
      [hashToken(token)]
    );
  },

  /** Remove all refresh tokens for a user (logout from all devices) */
  async deleteAllForUser(userId: number): Promise<void> {
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
  },
};
