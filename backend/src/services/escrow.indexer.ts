import { query } from "../config/database";
import { OnChainEscrowModel } from "../models/onchain_escrow.model";
import { syncEscrowEvents } from "./escrow.service";
import { getEscrowState } from "./escrow.service";
import { logger } from "../utils/logger";

const CURSOR_NAME = "repair_escrow";

interface CursorRow { tx_digest: string | null; event_seq: string | null }

async function loadCursor(): Promise<{ txDigest: string; eventSeq: string } | null> {
  const rows = await query<CursorRow>("SELECT tx_digest, event_seq FROM indexer_cursors WHERE name = $1", [CURSOR_NAME]);
  if (!rows[0] || !rows[0].tx_digest || !rows[0].event_seq) return null;
  return { txDigest: rows[0].tx_digest, eventSeq: rows[0].event_seq };
}

async function saveCursor(cursor: { txDigest: string; eventSeq: string } | null): Promise<void> {
  if (!cursor) return;
  await query(
    `INSERT INTO indexer_cursors (name, tx_digest, event_seq, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (name) DO UPDATE SET tx_digest = $2, event_seq = $3, updated_at = NOW()`,
    [CURSOR_NAME, cursor.txDigest, cursor.eventSeq]
  );
}

/** Map one parsed Move event to a mirror-table upsert. */
async function handleEvent(type: string, parsed: Record<string, unknown>, txDigest: string): Promise<void> {
  const escrowId = String(parsed.escrow_id ?? "");
  if (!escrowId) return;

  switch (type) {
    case "EscrowCreated":
      await OnChainEscrowModel.upsert({
        escrowObjectId: escrowId,
        customerAddress: String(parsed.customer ?? ""),
        shopAddress: String(parsed.shop ?? ""),
        repairRequestId: parsed.repair_id != null ? Number(parsed.repair_id) : null,
        totalAmount: String(parsed.total ?? "0"),
        status: "active",
        txDigest,
        isCreate: true,
      });
      break;
    // For state-changing events, re-read the object so amounts/status stay exact.
    case "MilestoneReleased":
    case "EscrowRefunded":
    case "DisputeRaised":
    case "DisputeResolved":
    case "EscrowCompleted": {
      const state = await getEscrowState(escrowId);
      if (state) {
        await OnChainEscrowModel.upsert({
          escrowObjectId: escrowId,
          releasedAmount: state.released,
          status: state.status,
          txDigest,
        });
      }
      break;
    }
    default:
      break;
  }
}

let timer: NodeJS.Timeout | null = null;

/** Start the polling indexer. Safe no-op-friendly: errors are logged, not thrown. */
export function startEscrowIndexer(intervalMs = 5000): void {
  if (timer) return;
  const tick = async () => {
    try {
      const cursor = await loadCursor();
      const next = await syncEscrowEvents(cursor, handleEvent);
      if (next && (next.txDigest !== cursor?.txDigest || next.eventSeq !== cursor?.eventSeq)) {
        await saveCursor(next);
      }
    } catch (err) {
      logger.error("escrow indexer tick failed:", err);
    }
  };
  timer = setInterval(tick, intervalMs);
  logger.info(`🔁 Escrow event indexer started (every ${intervalMs}ms)`);
}

export function stopEscrowIndexer(): void {
  if (timer) { clearInterval(timer); timer = null; }
}
