import { pool, query } from "../config/database";
import {
  OrderRow,
  SafeOrder,
  SafeOrderItem,
  SafeOrderAccessory,
  OrderStatus,
  LaptopConfigRow,
  AccessoryRow,
} from "../types";

function toSafeOrder(row: OrderRow & { user_full_name?: string; user_email?: string }): SafeOrder {
  const base: SafeOrder = {
    id: row.id,
    userId: row.user_id,
    systemRequestId: row.system_request_id,
    status: row.status,
    totalAmount: parseFloat(row.total_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.user_full_name) {
    base.user = { id: row.user_id, fullName: row.user_full_name, email: row.user_email ?? "" };
  }
  return base;
}

export const OrderModel = {
  // Creates order + items + accessories in a single transaction, also decrements inventory
  async create(
    userId: number,
    systemRequestId: number | null,
    items: { configurationId: number; quantity: number }[],
    accessories: { accessoryId: number; quantity: number }[]
  ): Promise<SafeOrder> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Validate, stock-check, and price laptops
      let totalAmount = 0;
      const processedItems: SafeOrderItem[] = [];
      for (const item of items) {
        const res = await client.query<LaptopConfigRow>(
          "SELECT * FROM laptop_configurations WHERE id = $1 AND is_active = TRUE LIMIT 1",
          [item.configurationId]
        );
        if (!res.rows[0]) throw new Error(`Laptop ${item.configurationId} not found or inactive`);

        // Check laptop inventory stock
        const invRes = await client.query<{ quantity_in_stock: number }>(
          "SELECT quantity_in_stock FROM inventory WHERE configuration_id = $1 LIMIT 1",
          [item.configurationId]
        );
        const inStock = invRes.rows[0]?.quantity_in_stock ?? 0;
        if (inStock < item.quantity) {
          throw new Error(`Not enough stock for "${res.rows[0].name}" (${inStock} available)`);
        }

        const unitPrice = parseFloat(res.rows[0].base_price);
        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;
        processedItems.push({
          id: 0,
          configurationId: item.configurationId,
          laptopName: res.rows[0].name,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      // Validate and price accessories
      const processedAccessories: SafeOrderAccessory[] = [];
      for (const acc of accessories) {
        const res = await client.query<AccessoryRow>(
          "SELECT * FROM accessories WHERE id = $1 AND is_active = TRUE LIMIT 1",
          [acc.accessoryId]
        );
        if (!res.rows[0]) throw new Error(`Accessory ${acc.accessoryId} not found or inactive`);
        if (res.rows[0].quantity_in_stock < acc.quantity)
          throw new Error(`Not enough stock for "${res.rows[0].name}"`);
        const unitPrice = parseFloat(res.rows[0].price);
        const subtotal = unitPrice * acc.quantity;
        totalAmount += subtotal;
        processedAccessories.push({
          id: 0,
          accessoryId: acc.accessoryId,
          accessoryName: res.rows[0].name,
          quantity: acc.quantity,
          unitPrice,
          subtotal,
        });
      }

      // Create order
      const orderRes = await client.query<OrderRow>(
        "INSERT INTO orders (user_id, system_request_id, total_amount) VALUES ($1, $2, $3) RETURNING *",
        [userId, systemRequestId, totalAmount]
      );
      const order = orderRes.rows[0];

      // Insert items + decrement laptop inventory
      for (const item of processedItems) {
        await client.query(
          "INSERT INTO order_items (order_id, configuration_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)",
          [order.id, item.configurationId, item.quantity, item.unitPrice, item.subtotal]
        );
        await client.query(
          "UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE configuration_id = $2",
          [item.quantity, item.configurationId]
        );
      }

      // Insert accessories + decrement stock
      for (const acc of processedAccessories) {
        await client.query(
          "INSERT INTO order_accessories (order_id, accessory_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)",
          [order.id, acc.accessoryId, acc.quantity, acc.unitPrice, acc.subtotal]
        );
        await client.query(
          "UPDATE accessories SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE id = $2",
          [acc.quantity, acc.accessoryId]
        );
      }

      await client.query("COMMIT");

      return {
        ...toSafeOrder(order),
        items: processedItems,
        accessories: processedAccessories,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async findAll(
    page: number,
    limit: number,
    filters: { userId?: number; status?: string }
  ): Promise<{ orders: SafeOrder[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.userId) { conditions.push(`o.user_id = $${p++}`); params.push(filters.userId); }
    if (filters.status) { conditions.push(`o.status = $${p++}`);   params.push(filters.status); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    type AdminRow = OrderRow & { user_full_name: string; user_email: string };
    const [rows, count] = await Promise.all([
      query<AdminRow>(
        `SELECT o.*, u.full_name AS user_full_name, u.email AS user_email
         FROM orders o JOIN users u ON u.id = o.user_id
         ${where} ORDER BY o.created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM orders o ${where}`,
        params
      ),
    ]);
    return { orders: rows.map(toSafeOrder), total: parseInt(count[0].count, 10) };
  },

  async findById(id: number): Promise<SafeOrder | null> {
    type AdminRow = OrderRow & { user_full_name: string; user_email: string };
    const rows = await query<AdminRow>(
      `SELECT o.*, u.full_name AS user_full_name, u.email AS user_email
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1 LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;

    const order = toSafeOrder(rows[0]);

    // Fetch items
    type ItemRow = { id: number; configuration_id: number; laptop_name: string; quantity: number; unit_price: string; subtotal: string };
    const itemRows = await query<ItemRow>(
      `SELECT oi.id, oi.configuration_id, lc.name AS laptop_name, oi.quantity, oi.unit_price, oi.subtotal
       FROM order_items oi JOIN laptop_configurations lc ON lc.id = oi.configuration_id
       WHERE oi.order_id = $1`,
      [id]
    );
    order.items = itemRows.map((r) => ({
      id: r.id,
      configurationId: r.configuration_id,
      laptopName: r.laptop_name,
      quantity: r.quantity,
      unitPrice: parseFloat(r.unit_price),
      subtotal: parseFloat(r.subtotal),
    }));

    // Fetch accessories
    type AccRow = { id: number; accessory_id: number; accessory_name: string; quantity: number; unit_price: string; subtotal: string };
    const accRows = await query<AccRow>(
      `SELECT oa.id, oa.accessory_id, a.name AS accessory_name, oa.quantity, oa.unit_price, oa.subtotal
       FROM order_accessories oa JOIN accessories a ON a.id = oa.accessory_id
       WHERE oa.order_id = $1`,
      [id]
    );
    order.accessories = accRows.map((r) => ({
      id: r.id,
      accessoryId: r.accessory_id,
      accessoryName: r.accessory_name,
      quantity: r.quantity,
      unitPrice: parseFloat(r.unit_price),
      subtotal: parseFloat(r.subtotal),
    }));

    return order;
  },

  async updateStatus(id: number, status: OrderStatus): Promise<SafeOrder | null> {
    const rows = await query<OrderRow>(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );
    return rows[0] ? toSafeOrder(rows[0]) : null;
  },

  // Cancels an order and restores all decremented inventory in a single transaction
  async cancel(id: number): Promise<SafeOrder | null> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderRes = await client.query<OrderRow>(
        "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status != 'cancelled' RETURNING *",
        [id]
      );
      if (!orderRes.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      // Restore laptop inventory
      await client.query(
        `UPDATE inventory i
         SET quantity_in_stock = i.quantity_in_stock + oi.quantity, updated_at = NOW()
         FROM order_items oi
         WHERE oi.order_id = $1 AND i.configuration_id = oi.configuration_id`,
        [id]
      );

      // Restore accessory stock
      await client.query(
        `UPDATE accessories a
         SET quantity_in_stock = a.quantity_in_stock + oa.quantity, updated_at = NOW()
         FROM order_accessories oa
         WHERE oa.order_id = $1 AND a.id = oa.accessory_id`,
        [id]
      );

      await client.query("COMMIT");
      return toSafeOrder(orderRes.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
