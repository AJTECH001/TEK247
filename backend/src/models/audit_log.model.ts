import { query } from "../config/database";
import { AdminAuditLog } from "../types";

export const AuditLogModel = {
  async create(data: {
    adminId: number;
    action: string;
    targetType: string;
    targetId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.adminId,
        data.action,
        data.targetType,
        data.targetId ?? null,
        data.changes ? JSON.stringify(data.changes) : null,
        data.ipAddress ?? null,
        data.userAgent ?? null,
      ]
    );
  },

  async findAll(page: number, limit: number): Promise<{ logs: AdminAuditLog[]; total: number }> {
    const offset = (page - 1) * limit;
    const [logs, countRes] = await Promise.all([
      query<any>(
        `SELECT l.*, u.full_name as admin_name 
         FROM admin_audit_logs l
         LEFT JOIN users u ON l.admin_id = u.id
         ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query<{ count: string }>("SELECT COUNT(*) FROM admin_audit_logs"),
    ]);

    return {
      logs: logs.map((l: any) => ({
        id: l.id,
        adminId: l.admin_id,
        adminName: l.admin_name,
        action: l.action,
        targetType: l.target_type,
        targetId: l.target_id,
        changes: l.changes,
        ipAddress: l.ip_address,
        userAgent: l.user_agent,
        createdAt: l.created_at,
      })),
      total: parseInt(countRes[0].count, 10),
    };
  },
};
