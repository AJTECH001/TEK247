import { query } from "../config/database";
import { RepairPaymentRow, SafeRepairPayment } from "../types";

function toSafe(row: RepairPaymentRow): SafeRepairPayment {
  return {
    id: row.id,
    repairRequestId: row.repair_request_id,
    amountPaid: parseFloat(row.amount_paid),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paidAt: row.paid_at,
  };
}

export const RepairPaymentModel = {
  async create(data: {
    repairRequestId: number;
    amountPaid: number;
    paymentMethod?: string;
  }): Promise<SafeRepairPayment> {
    const rows = await query<RepairPaymentRow>(
      `INSERT INTO repair_payments (repair_request_id, amount_paid, payment_method)
       VALUES ($1, $2, $3) RETURNING *`,
      [data.repairRequestId, data.amountPaid, data.paymentMethod ?? null]
    );
    return toSafe(rows[0]);
  },

  async findByRepair(repairRequestId: number): Promise<SafeRepairPayment[]> {
    const rows = await query<RepairPaymentRow>(
      "SELECT * FROM repair_payments WHERE repair_request_id = $1 ORDER BY paid_at DESC",
      [repairRequestId]
    );
    return rows.map(toSafe);
  },

  async findAll(
    page: number,
    limit: number
  ): Promise<{ payments: SafeRepairPayment[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      query<RepairPaymentRow>(
        "SELECT * FROM repair_payments ORDER BY paid_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
      query<{ count: string }>("SELECT COUNT(*)::text FROM repair_payments"),
    ]);
    return { payments: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async findById(id: number): Promise<SafeRepairPayment | null> {
    const rows = await query<RepairPaymentRow>(
      "SELECT * FROM repair_payments WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async complete(id: number): Promise<SafeRepairPayment | null> {
    const rows = await query<RepairPaymentRow>(
      "UPDATE repair_payments SET payment_status = 'completed' WHERE id = $1 AND payment_status = 'pending' RETURNING *",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async refund(id: number): Promise<SafeRepairPayment | null> {
    const rows = await query<RepairPaymentRow>(
      "UPDATE repair_payments SET payment_status = 'refunded' WHERE id = $1 AND payment_status = 'completed' RETURNING *",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
