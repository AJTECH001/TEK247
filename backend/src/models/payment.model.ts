import { query } from "../config/database";
import { PaymentRow, SafePayment, PaymentMethod } from "../types";

function toSafe(row: PaymentRow): SafePayment {
  return {
    id: row.id,
    orderId: row.order_id,
    amountPaid: parseFloat(row.amount_paid),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    transactionReference: row.transaction_reference,
    paymentProofUrl: row.payment_proof_url,
    paidAt: row.paid_at,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    notes: row.notes,
  };
}

export const PaymentModel = {
  async create(data: {
    orderId: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    paymentProofUrl?: string;
    notes?: string;
  }): Promise<SafePayment> {
    const rows = await query<PaymentRow>(
      `INSERT INTO payments (order_id, amount_paid, payment_method, transaction_reference, payment_proof_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.orderId,
        data.amountPaid,
        data.paymentMethod,
        data.transactionReference ?? null,
        data.paymentProofUrl ?? null,
        data.notes ?? null,
      ]
    );
    return toSafe(rows[0]);
  },

  async findByOrder(orderId: number): Promise<SafePayment[]> {
    const rows = await query<PaymentRow>(
      "SELECT * FROM payments WHERE order_id = $1 ORDER BY paid_at DESC",
      [orderId]
    );
    return rows.map(toSafe);
  },

  async findAll(
    page: number,
    limit: number,
    filters: { status?: string }
  ): Promise<{ payments: SafePayment[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.status) {
      conditions.push(`payment_status = $${p++}`);
      params.push(filters.status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows, count] = await Promise.all([
      query<PaymentRow>(
        `SELECT * FROM payments ${where} ORDER BY paid_at DESC LIMIT $${p} OFFSET $${p + 1}`,
        [...params, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text FROM payments ${where}`,
        params
      ),
    ]);
    return { payments: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async sumPaid(orderId: number): Promise<number> {
    const rows = await query<{ total: string }>(
      "SELECT COALESCE(SUM(amount_paid), 0)::text AS total FROM payments WHERE order_id = $1 AND payment_status != 'refunded'",
      [orderId]
    );
    return parseFloat(rows[0].total);
  },

  async findById(id: number): Promise<SafePayment | null> {
    const rows = await query<PaymentRow>(
      "SELECT * FROM payments WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async verify(id: number, adminId: number): Promise<SafePayment | null> {
    const rows = await query<PaymentRow>(
      `UPDATE payments SET payment_status = 'completed', verified_by = $1, verified_at = NOW()
       WHERE id = $2 AND payment_status = 'pending' RETURNING *`,
      [adminId, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async refund(id: number): Promise<SafePayment | null> {
    const rows = await query<PaymentRow>(
      `UPDATE payments SET payment_status = 'refunded' WHERE id = $1 AND payment_status = 'completed' RETURNING *`,
      [id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },
};
