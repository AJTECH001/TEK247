import API, { BaseResponse } from "./API";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscrowStatus = "active" | "completed" | "refunded" | "disputed" | "unknown";

export interface OnChainEscrow {
  objectId: string;
  customer: string;
  shop: string;
  repairId: number;
  total: string;
  released: string;
  remaining: string;
  status: EscrowStatus;
  milestones: { amount: string; status: number }[];
  coinType: string;
}

export interface MirroredEscrow {
  escrowObjectId: string;
  repairRequestId: number | null;
  customerAddress: string;
  shopAddress: string;
  coinType: string;
  totalAmount: string;
  releasedAmount: string;
  status: EscrowStatus;
  createTxDigest: string | null;
  lastTxDigest: string | null;
  createdAt: string;
}

const ESCROWS = "escrows";

// ─── API ──────────────────────────────────────────────────────────────────────

export const EscrowsAPI = {
  /** Mirror a freshly funded escrow into the backend (after on-chain exec). */
  index(body: { escrowObjectId: string; repairRequestId?: number; txDigest?: string }) {
    return API.post<typeof body, OnChainEscrow>(`${ESCROWS}/index`, body);
  },

  /** Fresh authoritative on-chain read. */
  getOne(objectId: string): Promise<BaseResponse<OnChainEscrow>> {
    return API.get<OnChainEscrow>(`${ESCROWS}/${objectId}`);
  },

  /** Mirrored escrows for a repair request (fast list). */
  listByRepair(repairId: number): Promise<BaseResponse<MirroredEscrow[]>> {
    return API.get<MirroredEscrow[]>(`${ESCROWS}/repair/${repairId}`);
  },

  /** Admin/arbiter: resolve a disputed escrow on-chain. */
  resolve(objectId: string, customerBps: number) {
    return API.post<{ customerBps: number }, { digest: string; status: EscrowStatus }>(
      `${ESCROWS}/${objectId}/resolve`,
      { customerBps }
    );
  },
};
