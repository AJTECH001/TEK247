import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@mysten/dapp-kit";
import toast from "react-hot-toast";
import { EscrowsAPI, type OnChainEscrow } from "../../../network/escrows";
import { SHOP_ADDRESS, fromUsdcUnits, explorerObject, explorerTx } from "../../../network/onchain";
import { useEscrowActions } from "./useEscrowActions";

interface Props {
  repairId: number;
  isAdmin: boolean;
}

const MILESTONE_LABELS = ["Diagnosis", "Repair", "Delivery"];
// Default split of the total across the three repair stages.
const DEFAULT_SPLIT = [0.2, 0.5, 0.3];

const M_STATUS = ["Pending", "Submitted", "Released"] as const;

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-lorryBlueBackground text-lorryBlueText",
    completed: "bg-lorryGreenBg text-lorryGreenText",
    refunded: "bg-lorryYellowBg text-lorryYellowText",
    disputed: "bg-lorryRedBg text-lorryRedText",
    unknown: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? styles.unknown}`}>
      {status}
    </span>
  );
}

export default function RepairEscrowPanel({ repairId, isAdmin }: Props) {
  const qc = useQueryClient();
  const actions = useEscrowActions();
  const [amount, setAmount] = useState("10");
  const [customerBps, setCustomerBps] = useState("5000");

  // Existing escrows mirrored for this repair (fast list).
  const listQuery = useQuery({
    queryKey: ["ESCROWS_BY_REPAIR", repairId],
    queryFn: () => EscrowsAPI.listByRepair(repairId),
  });
  const mirrored = useMemo(() => {
    const res = listQuery.data;
    if (!res || "error" in res) return null;
    return res.data?.[0] ?? null;
  }, [listQuery.data]);
  const escrowId = mirrored?.escrowObjectId ?? null;

  // Live authoritative state (polled) once we have an object id.
  const liveQuery = useQuery({
    queryKey: ["ESCROW_LIVE", escrowId],
    queryFn: () => EscrowsAPI.getOne(escrowId as string),
    enabled: !!escrowId,
    refetchInterval: 4000,
  });
  const escrow: OnChainEscrow | null =
    liveQuery.data && !("error" in liveQuery.data) ? (liveQuery.data.data as OnChainEscrow) : null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["ESCROWS_BY_REPAIR", repairId] });
    qc.invalidateQueries({ queryKey: ["ESCROW_LIVE", escrowId] });
  };

  const milestonePreview = useMemo(() => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) return [];
    // Largest-remainder rounding so the parts sum exactly to the total.
    const raw = DEFAULT_SPLIT.map((p) => Math.round(total * p * 100) / 100);
    const diff = Math.round((total - raw.reduce((a, b) => a + b, 0)) * 100) / 100;
    raw[raw.length - 1] = Math.round((raw[raw.length - 1] + diff) * 100) / 100;
    return raw;
  }, [amount]);

  async function handleFund() {
    if (milestonePreview.length === 0) { toast.error("Enter a valid amount"); return; }
    try {
      await toast.promise(
        actions.createEscrow({
          shop: SHOP_ADDRESS,
          repairId,
          milestones: milestonePreview.map((a) => ({ amount: a })),
          deadlineHours: 72,
        }),
        { loading: "Funding escrow on-chain…", success: "Escrow funded on Sui 🎉", error: (e) => e.message }
      );
      refresh();
    } catch { /* toast already shown */ }
  }

  async function run(fn: () => Promise<string>, labels: { loading: string; success: string }) {
    try {
      await toast.promise(fn(), { loading: labels.loading, success: labels.success, error: (e) => e.message });
      refresh();
    } catch { /* toast already shown */ }
  }

  async function handleResolve() {
    if (!escrowId) return;
    const bps = parseInt(customerBps, 10);
    if (isNaN(bps) || bps < 0 || bps > 10000) { toast.error("Customer share must be 0–10000 bps"); return; }
    const res = await EscrowsAPI.resolve(escrowId, bps);
    if ("error" in res) { toast.error(res.error); return; }
    toast.success("Dispute resolved on-chain");
    refresh();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="border border-lorryBlue/30 rounded-lg p-4 space-y-4 bg-lorryBlueBackground/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide flex items-center gap-2">
          On-chain Escrow
          <span className="text-[10px] font-normal normal-case text-inputGrey">USDC · Sui testnet</span>
        </p>
        {escrow && <StatusPill status={escrow.status} />}
      </div>

      {/* Wallet connect */}
      {!actions.account && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-inputGrey">Pay with Google — no wallet, no seed phrase, no gas.</p>
          <ConnectButton connectText="Continue with Google" />
        </div>
      )}

      {/* Fund form (customer, no escrow yet) */}
      {actions.account && !escrowId && !isAdmin && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-inputGrey mb-1">Amount to deposit (USDC)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue"
            />
          </div>
          {milestonePreview.length > 0 && (
            <div className="text-xs text-inputGrey space-y-1">
              <p className="font-medium text-lorryDarkBlack">Released only as work is approved:</p>
              {milestonePreview.map((a, i) => (
                <div key={i} className="flex justify-between">
                  <span>{MILESTONE_LABELS[i] ?? `Milestone ${i + 1}`}</span>
                  <span>{a.toFixed(2)} USDC</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleFund}
            disabled={actions.pending === "create"}
            className="w-full py-2 bg-lorryBlue text-white text-sm font-medium rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
          >
            {actions.pending === "create" ? "Funding…" : "Pay into escrow"}
          </button>
        </div>
      )}

      {actions.account && !escrowId && isAdmin && (
        <p className="text-xs text-inputGrey italic">No escrow funded for this repair yet.</p>
      )}

      {/* Active escrow */}
      {escrow && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-inputGrey">Total locked</p>
              <p className="font-medium text-lorryDarkBlack">{fromUsdcUnits(escrow.total).toFixed(2)} USDC</p>
            </div>
            <div>
              <p className="text-xs text-inputGrey">Released to shop</p>
              <p className="font-medium text-lorryDarkBlack">{fromUsdcUnits(escrow.released).toFixed(2)} USDC</p>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            {escrow.milestones.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-inputBorderGrey">
                <div className="text-sm">
                  <span className="font-medium text-lorryDarkBlack">{MILESTONE_LABELS[i] ?? `Milestone ${i + 1}`}</span>
                  <span className="text-inputGrey ml-2">{fromUsdcUnits(m.amount).toFixed(2)} USDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-inputGrey">{M_STATUS[m.status] ?? "—"}</span>
                  {/* Shop submits pending work */}
                  {isAdmin && escrow.status === "active" && m.status === 0 && (
                    <button
                      onClick={() => run(() => actions.submitMilestone(escrow.objectId, i), { loading: "Submitting…", success: "Marked done" })}
                      disabled={!!actions.pending}
                      className="px-2.5 py-1 bg-lorryBlue text-white text-xs rounded hover:bg-lorryBlue/90 disabled:opacity-50"
                    >
                      Mark done
                    </button>
                  )}
                  {/* Customer approves submitted work */}
                  {!isAdmin && escrow.status === "active" && m.status === 1 && (
                    <button
                      onClick={() => run(() => actions.approveMilestone(escrow.objectId, i), { loading: "Releasing…", success: "Released to shop" })}
                      disabled={!!actions.pending}
                      className="px-2.5 py-1 bg-lorryGreenText text-white text-xs rounded hover:opacity-90 disabled:opacity-50"
                    >
                      Approve & release
                    </button>
                  )}
                  {m.status === 2 && <span className="text-lorryGreenText text-xs">✓</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Dispute / refund */}
          {escrow.status === "active" && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => run(() => actions.raiseDispute(escrow.objectId), { loading: "Raising dispute…", success: "Dispute raised" })}
                disabled={!!actions.pending}
                className="px-3 py-1.5 bg-lorryRedBg text-lorryRedText text-xs rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Raise dispute
              </button>
              {!isAdmin && (
                <button
                  onClick={() => run(() => actions.refundIfUnstarted(escrow.objectId), { loading: "Refunding…", success: "Refunded" })}
                  disabled={!!actions.pending}
                  className="px-3 py-1.5 border border-inputBorderGrey text-xs rounded-lg hover:bg-offWhiteBackground disabled:opacity-50"
                >
                  Refund (if unstarted)
                </button>
              )}
            </div>
          )}

          {/* Admin/arbiter resolves a disputed escrow */}
          {isAdmin && escrow.status === "disputed" && (
            <div className="flex items-end gap-2 border-t border-inputBorderGrey pt-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-inputGrey mb-1">Customer share (bps, 0–10000)</label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={customerBps}
                  onChange={(e) => setCustomerBps(e.target.value)}
                  className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue"
                />
              </div>
              <button
                onClick={handleResolve}
                className="px-3 py-2 bg-lorryBlue text-white text-xs rounded-lg hover:bg-lorryBlue/90"
              >
                Resolve split
              </button>
            </div>
          )}

          {/* Explorer links */}
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={explorerObject(escrow.objectId)} target="_blank" rel="noreferrer" className="text-xs text-lorryBlue hover:underline">
              View escrow on explorer ↗
            </a>
            {mirrored?.lastTxDigest && (
              <a href={explorerTx(mirrored.lastTxDigest)} target="_blank" rel="noreferrer" className="text-xs text-lorryBlue hover:underline">
                Latest transaction ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
