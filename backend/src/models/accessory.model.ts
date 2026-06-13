import { query } from "../config/database";
import { AccessoryRow, SafeAccessory } from "../types";

function toSafe(row: AccessoryRow): SafeAccessory {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: parseFloat(row.price),
    quantityInStock: row.quantity_in_stock,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const AccessoryModel = {
  async findAll(
    page: number,
    limit: number,
    filters: { category?: string; includeInactive?: boolean }
  ): Promise<{ accessories: SafeAccessory[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (!filters.includeInactive) conditions.push("is_active = TRUE");
    if (filters.category) {
      conditions.push(`category = $${p++}`);
      params.push(filters.category);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows, count] = await Promise.all([
      query<AccessoryRow>(
        `SELECT * FROM accessories ${where} ORDER BY category, name LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM accessories ${where}`,
        params
      ),
    ]);
    return { accessories: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async findById(id: number): Promise<SafeAccessory | null> {
    const rows = await query<AccessoryRow>(
      "SELECT * FROM accessories WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async create(data: {
    name: string;
    category: string;
    description?: string;
    price: number;
    quantityInStock?: number;
  }): Promise<SafeAccessory> {
    const rows = await query<AccessoryRow>(
      `INSERT INTO accessories (name, category, description, price, quantity_in_stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.category, data.description ?? null, data.price, data.quantityInStock ?? 0]
    );
    return toSafe(rows[0]);
  },

  async update(
    id: number,
    data: { name?: string; description?: string | null; price?: number; isActive?: boolean }
  ): Promise<SafeAccessory | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    if (data.name !== undefined)        { sets.push(`name = $${p++}`);        params.push(data.name); }
    if (data.description !== undefined) { sets.push(`description = $${p++}`); params.push(data.description); }
    if (data.price !== undefined)       { sets.push(`price = $${p++}`);       params.push(data.price); }
    if (data.isActive !== undefined)    { sets.push(`is_active = $${p++}`);   params.push(data.isActive); }
    if (sets.length === 0) return null;
    sets.push("updated_at = NOW()");
    params.push(id);
    const rows = await query<AccessoryRow>(
      `UPDATE accessories SET ${sets.join(", ")} WHERE id = $${p} RETURNING *`,
      params
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async updateStock(id: number, quantity: number): Promise<SafeAccessory | null> {
    const rows = await query<AccessoryRow>(
      "UPDATE accessories SET quantity_in_stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [quantity, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async deactivate(id: number): Promise<SafeAccessory | null> {
    const rows = await query<AccessoryRow>(
      "UPDATE accessories SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
