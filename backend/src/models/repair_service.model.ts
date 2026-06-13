import { query } from "../config/database";
import { RepairServiceRow, SafeRepairService, RepairType } from "../types";

function toSafe(row: RepairServiceRow): SafeRepairService {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    estimatedPrice: parseFloat(row.estimated_price),
    repairType: row.repair_type,
    estimatedDuration: row.estimated_duration,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const RepairServiceModel = {
  async findAll(includeInactive = false): Promise<SafeRepairService[]> {
    const where = includeInactive ? "" : "WHERE is_active = TRUE";
    const rows = await query<RepairServiceRow>(
      `SELECT * FROM repair_services ${where} ORDER BY repair_type, name`
    );
    return rows.map(toSafe);
  },

  async findById(id: number): Promise<SafeRepairService | null> {
    const rows = await query<RepairServiceRow>(
      "SELECT * FROM repair_services WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async create(data: {
    name: string;
    description?: string;
    estimatedPrice: number;
    repairType: RepairType;
    estimatedDuration?: string;
  }): Promise<SafeRepairService> {
    const rows = await query<RepairServiceRow>(
      `INSERT INTO repair_services (name, description, estimated_price, repair_type, estimated_duration)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.name,
        data.description ?? null,
        data.estimatedPrice,
        data.repairType,
        data.estimatedDuration ?? null,
      ]
    );
    return toSafe(rows[0]);
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      estimatedPrice?: number;
      estimatedDuration?: string | null;
      isActive?: boolean;
    }
  ): Promise<SafeRepairService | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (data.name !== undefined)              { sets.push(`name = $${p++}`);               params.push(data.name); }
    if (data.description !== undefined)       { sets.push(`description = $${p++}`);        params.push(data.description); }
    if (data.estimatedPrice !== undefined)    { sets.push(`estimated_price = $${p++}`);    params.push(data.estimatedPrice); }
    if (data.estimatedDuration !== undefined) { sets.push(`estimated_duration = $${p++}`); params.push(data.estimatedDuration); }
    if (data.isActive !== undefined)          { sets.push(`is_active = $${p++}`);          params.push(data.isActive); }
    if (sets.length === 0) return null;

    sets.push("updated_at = NOW()");
    params.push(id);

    const rows = await query<RepairServiceRow>(
      `UPDATE repair_services SET ${sets.join(", ")} WHERE id = $${p} RETURNING *`,
      params
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async deactivate(id: number): Promise<SafeRepairService | null> {
    const rows = await query<RepairServiceRow>(
      "UPDATE repair_services SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
