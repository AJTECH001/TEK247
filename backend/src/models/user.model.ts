import { query } from "../config/database";
import { UserRow, SafeUser } from "../types";

export function toSafeUser(row: UserRow): SafeUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    isEmailVerified: row.is_email_verified,
    status: row.status,
    suiAddress: row.sui_address,
    createdAt: row.created_at,
  };
}

export const UserModel = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      "SELECT * FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] ?? null;
  },

  async findByZkLoginSub(sub: string): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      "SELECT * FROM users WHERE zklogin_sub = $1 LIMIT 1",
      [sub]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    full_name: string;
    email: string;
    password_hash: string | null;
    role?: "user" | "admin";
    sui_address?: string;
    zklogin_salt?: string;
    zklogin_sub?: string;
  }): Promise<UserRow> {
    const rows = await query<UserRow>(
      `INSERT INTO users (full_name, email, password_hash, role, sui_address, zklogin_salt, zklogin_sub, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.full_name,
        data.email,
        data.password_hash,
        data.role ?? "user",
        data.sui_address ?? null,
        data.zklogin_salt ?? null,
        data.zklogin_sub ?? null,
        data.zklogin_sub ? true : false, // Auto-verify if zkLogin
      ]
    );
    return rows[0];
  },

  async markEmailVerified(id: number): Promise<void> {
    await query(
      "UPDATE users SET is_email_verified = TRUE WHERE id = $1",
      [id]
    );
  },

  async updateZkLoginInfo(
    userId: number,
    data: {
      sui_address: string;
      zklogin_salt: string;
      zklogin_sub: string;
    }
  ): Promise<UserRow> {
    const rows = await query<UserRow>(
      `UPDATE users 
       SET sui_address = $1, zklogin_salt = $2, zklogin_sub = $3, is_email_verified = TRUE 
       WHERE id = $4 
       RETURNING *`,
      [data.sui_address, data.zklogin_salt, data.zklogin_sub, userId]
    );
    return rows[0];
  },

  async updatePassword(id: number, password_hash: string): Promise<void> {
    await query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [password_hash, id]
    );
  },

  async updateRole(id: number, role: "user" | "admin"): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
      [role, id]
    );
    return rows[0] ?? null;
  },

  async updateStatus(
    id: number,
    status: "active" | "inactive" | "suspended"
  ): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      "UPDATE users SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return rows[0] ?? null;
  },

  async findAll(page: number, limit: number): Promise<{ users: SafeUser[]; total: number }> {
    const offset = (page - 1) * limit;
    const rows = await query<UserRow>(
      "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const countRows = await query<{ count: string }>("SELECT COUNT(*)::text FROM users");
    return {
      users: rows.map(toSafeUser),
      total: parseInt(countRows[0].count, 10),
    };
  },
};
