import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallets, useConnectWallet } from "@mysten/dapp-kit";
import { isEnokiWallet, type EnokiWallet } from "@mysten/enoki";
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

function MilestoneBadge({ status }: { status: number }) {
  const styles = [
    "bg-gray-100 text-gray-600",            // Pending
    "bg-lorryBlueBackground text-lorryBlueText", // Submitted
    "bg-lorryGreenBg text-lorryGreenText",  // Released
  ];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles[0]}`}>
      {status === 2 && <span aria-hidden>✓</span>}
      {M_STATUS[status] ?? "—"}
    </span>
  );
}

export default function RepairEscrowPanel({ repairId, isAdmin }: Props) {
  const qc = useQueryClient();
  const actions = useEscrowActions();
  const [amount, setAmount] = useState("10");
  const [customerPct, setCustomerPct] = useState(50);

  // Connect the Google zkLogin wallet directly — no generic "Connect a Wallet" modal.
  const wallets = useWallets();
  const { mutate: connectWallet, isPending: connecting } = useConnectWallet();
  const googleWallet = wallets.find(
    (w): w is EnokiWallet => isEnokiWallet(w) && w.provider === "google"
  );

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
    const bps = Math.round(customerPct * 100); // % → basis points (0–10000)
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

      {/* Wallet connect — direct Google zkLogin, no generic wallet modal */}
      {!actions.account && (
        <div className="flex flex-col items-start gap-2 rounded-lg bg-white border border-inputBorderGrey p-3">
          <p className="text-sm font-medium text-lorryDarkBlack">Pay with your Google account</p>
          <p className="text-xs text-textGrey">No wallet, no seed phrase, and gas is sponsored — you pay $0 in fees.</p>
          <button
            onClick={() => googleWallet && connectWallet({ wallet: googleWallet })}
            disabled={!googleWallet || connecting}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 min-h-[44px] bg-lorryBlue text-white text-sm font-semibold rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.85-2.65-5.85-5.9S8.8 6.6 12 6.6c1.85 0 3.1.8 3.8 1.45l2.6-2.5C16.8 3.95 14.6 3 12 3 6.95 3 2.85 7.1 2.85 12.1S6.95 21.2 12 21.2c5.3 0 8.8-3.7 8.8-8.95 0-.6-.05-1.05-.15-1.55z" />
            </svg>
            {connecting ? "Connecting…" : "Continue with Google"}
          </button>
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
            className="w-full min-h-[44px] py-3 bg-lorryBlue text-white text-base font-semibold rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
          >
            {actions.pending === "create" ? "Funding…" : "Pay into escrow"}
          </button>
          <p className="text-[11px] text-textGrey text-center">
            Held safely on-chain · released only as you approve each stage · gas sponsored
          </p>
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
                  <MilestoneBadge status={m.status} />
                  {/* Shop submits pending work */}
                  {isAdmin && escrow.status === "active" && m.status === 0 && (
                    <button
                      onClick={() => run(() => actions.submitMilestone(escrow.objectId, i), { loading: "Submitting…", success: "Marked done" })}
                      disabled={!!actions.pending}
                      className="min-h-[40px] px-3.5 py-2 bg-lorryBlue text-white text-sm font-medium rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
                    >
                      Mark done
                    </button>
                  )}
                  {/* Customer approves submitted work */}
                  {!isAdmin && escrow.status === "active" && m.status === 1 && (
                    <button
                      onClick={() => run(() => actions.approveMilestone(escrow.objectId, i), { loading: "Releasing…", success: "Released to shop" })}
                      disabled={!!actions.pending}
                      className="min-h-[40px] px-3.5 py-2 bg-lorryGreenText text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      Approve &amp; release
                    </button>
                  )}
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
            <div className="border-t border-inputBorderGrey pt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="customer-share" className="text-sm font-medium text-lorryDarkBlack">Customer refund</label>
                  <span className="text-sm font-semibold text-lorryBlue">{customerPct}%</span>
                </div>
                <input
                  id="customer-share"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={customerPct}
                  onChange={(e) => setCustomerPct(parseInt(e.target.value, 10))}
                  className="w-full accent-lorryBlue"
                />
                {(() => {
                  const total = fromUsdcUnits(escrow.total);
                  const toCustomer = (total * customerPct) / 100;
                  return (
                    <div className="mt-2 flex justify-between text-xs text-textGrey">
                      <span>Customer gets <strong className="text-lorryDarkBlack">{toCustomer.toFixed(2)} USDC</strong></span>
                      <span>Shop gets <strong className="text-lorryDarkBlack">{(total - toCustomer).toFixed(2)} USDC</strong></span>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={handleResolve}
                className="w-full min-h-[44px] py-2.5 bg-lorryBlue text-white text-sm font-semibold rounded-lg hover:bg-lorryBlue/90"
              >
                Resolve dispute &amp; split funds
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
