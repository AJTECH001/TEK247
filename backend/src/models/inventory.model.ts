import { query } from "../config/database";
import { InventoryRow, SafeInventory } from "../types";

function toSafe(row: InventoryRow & { laptop_name?: string }): SafeInventory {
  return {
    id: row.id,
    configurationId: row.configuration_id,
    laptopName: row.laptop_name,
    quantityInStock: row.quantity_in_stock,
    restockThreshold: row.restock_threshold,
    updatedAt: row.updated_at,
  };
}

export const InventoryModel = {
  async findAll(): Promise<SafeInventory[]> {
    type JoinRow = InventoryRow & { laptop_name: string };
    const rows = await query<JoinRow>(
      `SELECT i.*, lc.name AS laptop_name
       FROM inventory i
       JOIN laptop_configurations lc ON lc.id = i.configuration_id
       ORDER BY lc.name`
    );
    return rows.map(toSafe);
  },

  async findByConfigId(configurationId: number): Promise<SafeInventory | null> {
    type JoinRow = InventoryRow & { laptop_name: string };
    const rows = await query<JoinRow>(
      `SELECT i.*, lc.name AS laptop_name
       FROM inventory i
       JOIN laptop_configurations lc ON lc.id = i.configuration_id
       WHERE i.configuration_id = $1 LIMIT 1`,
      [configurationId]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async upsert(
    configurationId: number,
    quantityInStock: number,
    restockThreshold?: number
  ): Promise<SafeInventory> {
    const rows = await query<InventoryRow>(
      `INSERT INTO inventory (configuration_id, quantity_in_stock, restock_threshold)
       VALUES ($1, $2, $3)
       ON CONFLICT (configuration_id) DO UPDATE
         SET quantity_in_stock = EXCLUDED.quantity_in_stock,
             restock_threshold = COALESCE($3, inventory.restock_threshold),
             updated_at = NOW()
       RETURNING *`,
      [configurationId, quantityInStock, restockThreshold ?? null]
    );
    return toSafe(rows[0]);
  },
};
