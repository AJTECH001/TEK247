import { Transaction } from "@mysten/sui/transactions";
import { suiClient, platformSigner } from "./sui.client";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const MODULE = "repair_escrow";
const SUI_CLOCK = "0x6";

export type EscrowStatus = "active" | "completed" | "refunded" | "disputed" | "unknown";

const STATUS_MAP: Record<number, EscrowStatus> = {
  0: "active",
  1: "completed",
  2: "refunded",
  3: "disputed",
};

export interface OnChainEscrowState {
  objectId: string;
  customer: string;
  shop: string;
  repairId: number;
  total: string;       // raw smallest-unit (e.g. USDC 6dp)
  released: string;
  remaining: string;
  status: EscrowStatus;
  milestones: { amount: string; status: number }[];
  coinType: string;
}

/** Read fresh escrow state directly from its on-chain object (source of truth). */
export async function getEscrowState(objectId: string): Promise<OnChainEscrowState | null> {
  const res = await suiClient.getObject({ id: objectId, options: { showContent: true, showType: true } });
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;

  const f = content.fields as Record<string, unknown>;
  const milestonesRaw = (f.milestones as { fields: { amount: string; status: number } }[]) ?? [];
  const released = String(f.released ?? "0");
  // Coin type T is the type param of RepairEscrow<T>
  const typeStr = (res.data?.type as string) ?? "";
  const coinType = typeStr.slice(typeStr.indexOf("<") + 1, typeStr.lastIndexOf(">")) || env.USDC_TYPE;

  const balance = String((f.balance as { fields?: { value?: string } })?.fields?.value ?? f.balance ?? "0");
  const total = (BigInt(released) + BigInt(balance)).toString();

  return {
    objectId,
    customer: String(f.customer ?? ""),
    shop: String(f.shop ?? ""),
    repairId: Number(f.repair_id ?? 0),
    total,
    released,
    remaining: balance,
    status: STATUS_MAP[Number(f.status ?? -1)] ?? "unknown",
    milestones: milestonesRaw.map((m) => ({ amount: String(m.fields.amount), status: Number(m.fields.status) })),
    coinType,
  };
}

/**
 * Pull recent escrow events emitted by our package and hand them to `onEvent`
 * for mirroring into Postgres. Returns the next cursor for incremental polling.
 */
export async function syncEscrowEvents(
  cursor: { txDigest: string; eventSeq: string } | null,
  onEvent: (type: string, parsed: Record<string, unknown>, txDigest: string) => Promise<void>,
): Promise<{ txDigest: string; eventSeq: string } | null> {
  try {
    const page = await suiClient.queryEvents({
      query: { MoveModule: { package: env.SUI_PACKAGE_ID, module: MODULE } },
      cursor: cursor ?? undefined,
      order: "ascending",
      limit: 50,
    });
    for (const ev of page.data) {
      const shortType = ev.type.split("::").pop() ?? ev.type;
      await onEvent(shortType, (ev.parsedJson ?? {}) as Record<string, unknown>, ev.id.txDigest);
    }
    return page.nextCursor ?? cursor;
  } catch (err) {
    logger.error("syncEscrowEvents failed:", err);
    return cursor;
  }
}

/**
 * Arbiter resolves a dispute on-chain, splitting the remaining balance.
 * `customerBps` is the share returned to the customer in basis points (0-10000).
 * Signed by the platform key holding the ArbiterCap — its only privileged action.
 */
export async function resolveDispute(
  escrowObjectId: string,
  coinType: string,
  customerBps: number,
): Promise<string> {
  if (customerBps < 0 || customerBps > 10_000) throw new Error("customerBps must be between 0 and 10000");

  const tx = new Transaction();
  tx.moveCall({
    target: `${env.SUI_PACKAGE_ID}::${MODULE}::resolve_dispute`,
    typeArguments: [coinType],
    arguments: [
      tx.object(env.SUI_ARBITER_CAP_ID),
      tx.object(escrowObjectId),
      tx.pure.u64(customerBps),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: platformSigner(),
    transaction: tx,
    options: { showEffects: true },
  });
  if (result.effects?.status.status !== "success") {
    throw new Error(`resolve_dispute failed: ${result.effects?.status.error ?? "unknown"}`);
  }
  return result.digest;
}

export { SUI_CLOCK };
