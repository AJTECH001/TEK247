import { query } from "../config/database";
import {
  DeliveryRow,
  DeliveryUpdateRow,
  SafeDelivery,
  SafeDeliveryUpdate,
  DeliveryStatus,
  DeliveryMethod,
} from "../types";

function toSafeUpdate(row: DeliveryUpdateRow): SafeDeliveryUpdate {
  return {
    id: row.id,
    status: row.status,
    location: row.location,
    notes: row.notes,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
  };
}

function toSafe(row: DeliveryRow): SafeDelivery {
  return {
    id: row.id,
    orderId: row.order_id,
    deliveryMethod: row.delivery_method,
    courierName: row.courier_name,
    trackingNumber: row.tracking_number,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    deliveryAddress: row.delivery_address,
    deliveryState: row.delivery_state,
    deliveryLga: row.delivery_lga,
    deliveryStatus: row.delivery_status,
    estimatedDeliveryDate: row.estimated_delivery_date,
    actualDeliveryDate: row.actual_delivery_date,
    deliveredTo: row.delivered_to,
    deliveryNotes: row.delivery_notes,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const DeliveryModel = {
  async create(data: {
    orderId: number;
    deliveryMethod: DeliveryMethod;
    recipientName: string;
    recipientPhone: string;
    deliveryAddress: string;
    deliveryState?: string;
    deliveryLga?: string;
    courierName?: string;
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
    deliveryNotes?: string;
  }): Promise<SafeDelivery> {
    const rows = await query<DeliveryRow>(
      `INSERT INTO deliveries
         (order_id, delivery_method, recipient_name, recipient_phone, delivery_address,
          delivery_state, delivery_lga, courier_name, tracking_number, estimated_delivery_date, delivery_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.orderId,
        data.deliveryMethod,
        data.recipientName,
        data.recipientPhone,
        data.deliveryAddress,
        data.deliveryState ?? null,
        data.deliveryLga ?? null,
        data.courierName ?? null,
        data.trackingNumber ?? null,
        data.estimatedDeliveryDate ?? null,
        data.deliveryNotes ?? null,
      ]
    );
    return toSafe(rows[0]);
  },

  async findByOrder(orderId: number): Promise<SafeDelivery | null> {
    const rows = await query<DeliveryRow>(
      "SELECT * FROM deliveries WHERE order_id = $1 LIMIT 1",
      [orderId]
    );
    if (!rows[0]) return null;
    const delivery = toSafe(rows[0]);
    delivery.updates = await DeliveryModel.getUpdates(rows[0].id);
    return delivery;
  },

  async findById(id: number): Promise<SafeDelivery | null> {
    const rows = await query<DeliveryRow>(
      "SELECT * FROM deliveries WHERE id = $1 LIMIT 1",
      [id]
    );
    if (!rows[0]) return null;
    const delivery = toSafe(rows[0]);
    delivery.updates = await DeliveryModel.getUpdates(id);
    return delivery;
  },

  async findAll(
    page: number,
    limit: number,
    filters: { status?: string; state?: string }
  ): Promise<{ deliveries: SafeDelivery[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.status) { conditions.push(`delivery_status = $${p++}`); params.push(filters.status); }
    if (filters.state)  { conditions.push(`delivery_state ILIKE $${p++}`); params.push(filters.state); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows, count] = await Promise.all([
      query<DeliveryRow>(
        `SELECT * FROM deliveries ${where} ORDER BY created_at DESC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM deliveries ${where}`,
        params
      ),
    ]);
    return { deliveries: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async getUpdates(deliveryId: number): Promise<SafeDeliveryUpdate[]> {
    const rows = await query<DeliveryUpdateRow>(
      "SELECT * FROM delivery_updates WHERE delivery_id = $1 ORDER BY created_at DESC",
      [deliveryId]
    );
    return rows.map(toSafeUpdate);
  },

  async updateStatus(
    id: number,
    status: DeliveryStatus,
    data: { location?: string; notes?: string; updatedBy?: number; deliveredTo?: string }
  ): Promise<SafeDelivery | null> {
    const sets = ["delivery_status = $1", "updated_at = NOW()"];
    const params: unknown[] = [status];
    let p = 2;

    if (status === "delivered") {
      sets.push(`actual_delivery_date = NOW()`);
      if (data.deliveredTo) { sets.push(`delivered_to = $${p++}`); params.push(data.deliveredTo); }
    }

    params.push(id);
    const rows = await query<DeliveryRow>(
      `UPDATE deliveries SET ${sets.join(", ")} WHERE id = $${p} RETURNING *`,
      params
    );
    if (!rows[0]) return null;

    // Log the update
    await query(
      `INSERT INTO delivery_updates (delivery_id, status, location, notes, updated_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, status, data.location ?? null, data.notes ?? null, data.updatedBy ?? null]
    );

    return DeliveryModel.findById(id);
  },

  async addUpdate(
    deliveryId: number,
    status: DeliveryStatus,
    location: string | null,
    notes: string | null,
    updatedBy: number | null
  ): Promise<SafeDeliveryUpdate> {
    const rows = await query<DeliveryUpdateRow>(
      `INSERT INTO delivery_updates (delivery_id, status, location, notes, updated_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [deliveryId, status, location, notes, updatedBy]
    );
    return toSafeUpdate(rows[0]);
  },

  async assign(
    id: number,
    assignedTo: number,
    courierName?: string,
    trackingNumber?: string
  ): Promise<SafeDelivery | null> {
    const sets = ["assigned_to = $1", "updated_at = NOW()"];
    const params: unknown[] = [assignedTo];
    let p = 2;
    if (courierName)    { sets.push(`courier_name = $${p++}`);    params.push(courierName); }
    if (trackingNumber) { sets.push(`tracking_number = $${p++}`); params.push(trackingNumber); }
    params.push(id);
    const rows = await query<DeliveryRow>(
      `UPDATE deliveries SET ${sets.join(", ")} WHERE id = $${p} RETURNING *`,
      params
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
