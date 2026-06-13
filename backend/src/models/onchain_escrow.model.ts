import { query } from "../config/database";

export interface OnChainEscrowRow {
  id: number;
  escrow_object_id: string;
  repair_request_id: number | null;
  customer_address: string;
  shop_address: string;
  coin_type: string;
  total_amount: string;
  released_amount: string;
  status: string;
  create_tx_digest: string | null;
  last_tx_digest: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeOnChainEscrow {
  id: number;
  escrowObjectId: string;
  repairRequestId: number | null;
  customerAddress: string;
  shopAddress: string;
  coinType: string;
  totalAmount: string;
  releasedAmount: string;
  status: string;
  createTxDigest: string | null;
  lastTxDigest: string | null;
  createdAt: string;
  updatedAt: string;
}

function toSafe(r: OnChainEscrowRow): SafeOnChainEscrow {
  return {
    id: r.id,
    escrowObjectId: r.escrow_object_id,
    repairRequestId: r.repair_request_id,
    customerAddress: r.customer_address,
    shopAddress: r.shop_address,
    coinType: r.coin_type,
    totalAmount: r.total_amount,
    releasedAmount: r.released_amount,
    status: r.status,
    createTxDigest: r.create_tx_digest,
    lastTxDigest: r.last_tx_digest,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const OnChainEscrowModel = {
  /** Insert on first sight (EscrowCreated), update on every later event. */
  async upsert(data: {
    escrowObjectId: string;
    repairRequestId?: number | null;
    customerAddress?: string;
    shopAddress?: string;
    coinType?: string;
    totalAmount?: string;
    releasedAmount?: string;
    status?: string;
    txDigest?: string;
    isCreate?: boolean;
  }): Promise<SafeOnChainEscrow> {
    const rows = await query<OnChainEscrowRow>(
      `INSERT INTO onchain_escrows
         (escrow_object_id, repair_request_id, customer_address, shop_address, coin_type,
          total_amount, released_amount, status, create_tx_digest, last_tx_digest)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       ON CONFLICT (escrow_object_id) DO UPDATE SET
         released_amount = COALESCE(EXCLUDED.released_amount, onchain_escrows.released_amount),
         status          = COALESCE(EXCLUDED.status, onchain_escrows.status),
         last_tx_digest  = COALESCE(EXCLUDED.last_tx_digest, onchain_escrows.last_tx_digest),
         updated_at      = NOW()
       RETURNING *`,
      [
        data.escrowObjectId,
        data.repairRequestId ?? null,
        data.customerAddress ?? "",
        data.shopAddress ?? "",
        data.coinType ?? "",
        data.totalAmount ?? "0",
        data.releasedAmount ?? "0",
        data.status ?? "active",
        data.txDigest ?? null,
      ]
    );
    return toSafe(rows[0]);
  },

  async findByObjectId(objectId: string): Promise<SafeOnChainEscrow | null> {
    const rows = await query<OnChainEscrowRow>(
      "SELECT * FROM onchain_escrows WHERE escrow_object_id = $1 LIMIT 1",
      [objectId]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async findByRepair(repairRequestId: number): Promise<SafeOnChainEscrow[]> {
    const rows = await query<OnChainEscrowRow>(
      "SELECT * FROM onchain_escrows WHERE repair_request_id = $1 ORDER BY created_at DESC",
      [repairRequestId]
    );
    return rows.map(toSafe);
  },

  async findByCustomer(address: string): Promise<SafeOnChainEscrow[]> {
    const rows = await query<OnChainEscrowRow>(
      "SELECT * FROM onchain_escrows WHERE customer_address = $1 ORDER BY created_at DESC",
      [address]
    );
    return rows.map(toSafe);
  },
};
