import { query } from "../config/database";
import {
  LaptopConfigRow,
  SafeLaptop,
  LaptopSpec,
  SafePriceHistoryEntry,
} from "../types";

function toSafe(row: LaptopConfigRow, specs?: LaptopSpec[]): SafeLaptop {
  return {
    id: row.id,
    name: row.name,
    shortSummary: row.short_summary,
    basePrice: parseFloat(row.base_price),
    isActive: row.is_active,
    createdAt: row.created_at,
    specs,
  };
}

async function getSpecs(configId: number): Promise<LaptopSpec[]> {
  type SpecRow = {
    spec_option_id: number;
    spec_name: string;
    category_id: number;
    category_name: string;
  };
  const rows = await query<SpecRow>(
    `SELECT so.id   AS spec_option_id,
            so.name AS spec_name,
            sc.id   AS category_id,
            sc.name AS category_name
     FROM laptop_configuration_specs lcs
     JOIN spec_options so ON so.id = lcs.spec_option_id
     JOIN spec_categories sc ON sc.id = so.category_id
     WHERE lcs.configuration_id = $1
     ORDER BY sc.name, so.name`,
    [configId]
  );
  return rows.map((r) => ({
    specOptionId: r.spec_option_id,
    specName: r.spec_name,
    categoryId: r.category_id,
    categoryName: r.category_name,
  }));
}

export const LaptopModel = {
  async findById(id: number): Promise<SafeLaptop | null> {
    const rows = await query<LaptopConfigRow>(
      "SELECT * FROM laptop_configurations WHERE id = $1 LIMIT 1",
      [id]
    );
    if (!rows[0]) return null;
    const specs = await getSpecs(id);
    return toSafe(rows[0], specs);
  },

  async findAll(
    page: number,
    limit: number,
    filters: { search?: string; minPrice?: number; maxPrice?: number; includeInactive?: boolean }
  ): Promise<{ laptops: SafeLaptop[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (!filters.includeInactive) conditions.push("is_active = TRUE");
    if (filters.search) {
      conditions.push(`(name ILIKE $${p} OR short_summary ILIKE $${p})`);
      params.push(`%${filters.search}%`);
      p++;
    }
    if (filters.minPrice !== undefined) {
      conditions.push(`base_price >= $${p}`);
      params.push(filters.minPrice);
      p++;
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`base_price <= $${p}`);
      params.push(filters.maxPrice);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows, count] = await Promise.all([
      query<LaptopConfigRow>(
        `SELECT * FROM laptop_configurations ${where} ORDER BY base_price ASC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM laptop_configurations ${where}`,
        params
      ),
    ]);

    return { laptops: rows.map((r) => toSafe(r)), total: parseInt(count[0].count, 10) };
  },

  async create(data: { name: string; shortSummary?: string; basePrice: number }): Promise<SafeLaptop> {
    const rows = await query<LaptopConfigRow>(
      `INSERT INTO laptop_configurations (name, short_summary, base_price) VALUES ($1, $2, $3) RETURNING *`,
      [data.name, data.shortSummary ?? null, data.basePrice]
    );
    return toSafe(rows[0], []);
  },

  async update(
    id: number,
    data: { name?: string; shortSummary?: string | null; isActive?: boolean }
  ): Promise<SafeLaptop | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (data.name !== undefined) { sets.push(`name = $${p++}`); params.push(data.name); }
    if (data.shortSummary !== undefined) { sets.push(`short_summary = $${p++}`); params.push(data.shortSummary); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${p++}`); params.push(data.isActive); }
    if (sets.length === 0) return null;

    sets.push("updated_at = NOW()");
    params.push(id);
    const rows = await query<LaptopConfigRow>(
      `UPDATE laptop_configurations SET ${sets.join(", ")} WHERE id = $${p} RETURNING *`,
      params
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  // Updates price and records the change in price_history
  async updatePrice(id: number, newPrice: number, adminId: number): Promise<SafeLaptop | null> {
    const existing = await query<LaptopConfigRow>(
      "SELECT * FROM laptop_configurations WHERE id = $1 LIMIT 1",
      [id]
    );
    if (!existing[0]) return null;

    await query(
      `INSERT INTO price_history (configuration_id, old_price, new_price, changed_by) VALUES ($1, $2, $3, $4)`,
      [id, existing[0].base_price, newPrice, adminId]
    );
    const rows = await query<LaptopConfigRow>(
      "UPDATE laptop_configurations SET base_price = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [newPrice, id]
    );
    return toSafe(rows[0]);
  },

  async addSpec(configId: number, specOptionId: number): Promise<void> {
    await query(
      "INSERT INTO laptop_configuration_specs (configuration_id, spec_option_id) VALUES ($1, $2)",
      [configId, specOptionId]
    );
  },

  async removeSpec(configId: number, specOptionId: number): Promise<boolean> {
    const rows = await query<{ id: number }>(
      "DELETE FROM laptop_configuration_specs WHERE configuration_id = $1 AND spec_option_id = $2 RETURNING id",
      [configId, specOptionId]
    );
    return rows.length > 0;
  },

  async priceHistory(configId: number): Promise<SafePriceHistoryEntry[]> {
    type HistoryRow = {
      id: number;
      old_price: string;
      new_price: string;
      changed_at: Date;
      changed_by: number;
      changed_by_name: string;
    };
    const rows = await query<HistoryRow>(
      `SELECT ph.id, ph.old_price, ph.new_price, ph.changed_at, ph.changed_by, u.full_name AS changed_by_name
       FROM price_history ph
       JOIN users u ON u.id = ph.changed_by
       WHERE ph.configuration_id = $1
       ORDER BY ph.changed_at DESC`,
      [configId]
    );
    return rows.map((r) => ({
      id: r.id,
      oldPrice: parseFloat(r.old_price),
      newPrice: parseFloat(r.new_price),
      changedAt: r.changed_at,
      changedBy: r.changed_by,
      changedByName: r.changed_by_name,
    }));
  },

  async deactivate(id: number): Promise<SafeLaptop | null> {
    const rows = await query<LaptopConfigRow>(
      "UPDATE laptop_configurations SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
