import { query } from "../config/database";
import { RepairRequestRow, SafeRepairRequest, RepairStatus } from "../types";

function toSafe(
  row: RepairRequestRow & { repair_service_name?: string | null; user_full_name?: string; user_email?: string }
): SafeRepairRequest {
  const base: SafeRepairRequest = {
    id: row.id,
    userId: row.user_id,
    laptopBrand: row.laptop_brand,
    laptopModel: row.laptop_model,
    issueDescription: row.issue_description,
    repairServiceId: row.repair_service_id,
    repairServiceName: row.repair_service_name ?? null,
    status: row.status,
    estimatedCost: row.estimated_cost !== null ? parseFloat(row.estimated_cost) : null,
    finalCost: row.final_cost !== null ? parseFloat(row.final_cost) : null,
    diagnosedBy: row.diagnosed_by,
    assignedTo: row.assigned_to ?? null,
    completedBy: row.completed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
  if (row.user_full_name) {
    base.user = { id: row.user_id, fullName: row.user_full_name, email: row.user_email ?? "" };
  }
  return base;
}

export const RepairModel = {
  async create(data: {
    userId: number;
    laptopBrand?: string;
    laptopModel?: string;
    issueDescription: string;
    repairServiceId?: number;
  }): Promise<SafeRepairRequest> {
    const rows = await query<RepairRequestRow>(
      `INSERT INTO repair_requests (user_id, laptop_brand, laptop_model, issue_description, repair_service_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.userId,
        data.laptopBrand ?? null,
        data.laptopModel ?? null,
        data.issueDescription,
        data.repairServiceId ?? null,
      ]
    );
    return toSafe(rows[0]);
  },

  async findAll(
    page: number,
    limit: number,
    filters: { userId?: number; status?: string }
  ): Promise<{ repairs: SafeRepairRequest[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.userId) { conditions.push(`r.user_id = $${p++}`);  params.push(filters.userId); }
    if (filters.status) { conditions.push(`r.status = $${p++}`);   params.push(filters.status); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    type JoinRow = RepairRequestRow & { repair_service_name: string | null; user_full_name: string; user_email: string };
    const [rows, count] = await Promise.all([
      query<JoinRow>(
        `SELECT r.*, rs.name AS repair_service_name, u.full_name AS user_full_name, u.email AS user_email
         FROM repair_requests r
         LEFT JOIN repair_services rs ON rs.id = r.repair_service_id
         JOIN users u ON u.id = r.user_id
         ${where} ORDER BY r.created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM repair_requests r ${where}`,
        params
      ),
    ]);
    return { repairs: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async findById(id: number): Promise<SafeRepairRequest | null> {
    type JoinRow = RepairRequestRow & { repair_service_name: string | null; user_full_name: string; user_email: string };
    const rows = await query<JoinRow>(
      `SELECT r.*, rs.name AS repair_service_name, u.full_name AS user_full_name, u.email AS user_email
       FROM repair_requests r
       LEFT JOIN repair_services rs ON rs.id = r.repair_service_id
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async diagnose(
    id: number,
    adminId: number,
    repairServiceId: number | null,
    estimatedCost: number | null
  ): Promise<SafeRepairRequest | null> {
    const rows = await query<RepairRequestRow>(
      `UPDATE repair_requests
       SET status = 'diagnosed', diagnosed_by = $1, repair_service_id = $2, estimated_cost = $3, updated_at = NOW()
       WHERE id = $4 AND status = 'pending' RETURNING *`,
      [adminId, repairServiceId, estimatedCost, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async updateStatus(id: number, status: RepairStatus): Promise<SafeRepairRequest | null> {
    const extraSets = status === "completed" ? ", completed_at = NOW()" : "";
    const rows = await query<RepairRequestRow>(
      `UPDATE repair_requests SET status = $1, updated_at = NOW()${extraSets} WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async setFinalCost(id: number, finalCost: number): Promise<SafeRepairRequest | null> {
    const rows = await query<RepairRequestRow>(
      "UPDATE repair_requests SET final_cost = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [finalCost, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async assign(id: number, technicianId: number): Promise<SafeRepairRequest | null> {
    const rows = await query<RepairRequestRow>(
      "UPDATE repair_requests SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [technicianId, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
