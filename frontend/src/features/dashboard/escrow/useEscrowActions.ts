import { useState } from "react";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { PACKAGE_ID, USDC_TYPE, ESCROW_MODULE, Target, toUsdcUnits } from "../../../network/onchain";
import { EscrowsAPI } from "../../../network/escrows";

const CLOCK_ID = "0x6";

export interface MilestoneInput {
  /** Human USDC amount, e.g. 25.5 */
  amount: number;
}

export interface CreateEscrowParams {
  shop: string;            // shop Sui address
  repairId: number;
  milestones: MilestoneInput[];
  /** Hours from now until both-party inactivity protections kick in. */
  deadlineHours: number;
}

/**
 * On-chain escrow actions, signed through the connected (Enoki zkLogin) wallet.
 * Gas is sponsored by Enoki for allowlisted targets, so the customer never needs
 * SUI or a browser wallet.
 */
export function useEscrowActions() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [pending, setPending] = useState<string | null>(null);

  async function exec(tx: Transaction): Promise<{ digest: string; objectChanges: unknown[] }> {
    const { digest } = await signAndExecute({ transaction: tx });
    // Re-fetch with object changes for authoritative results.
    const res = await client.waitForTransaction({
      digest,
      options: { showObjectChanges: true, showEffects: true },
    });
    if (res.effects?.status.status !== "success") {
      throw new Error(res.effects?.status.error ?? "Transaction failed on-chain");
    }
    return { digest, objectChanges: res.objectChanges ?? [] };
  }

  /** Customer funds a new milestone escrow in USDC. Returns the new escrow object id. */
  async function createEscrow(params: CreateEscrowParams): Promise<{ escrowObjectId: string; digest: string }> {
    if (!account) throw new Error("Connect with Google to pay into escrow");
    setPending("create");
    try {
      const amounts = params.milestones.map((m) => toUsdcUnits(m.amount));
      const total = amounts.reduce((a, b) => a + b, 0n);
      const deadlineMs = BigInt(Date.now() + params.deadlineHours * 3_600_000);

      const tx = new Transaction();
      tx.moveCall({
        target: Target.createEscrow,
        typeArguments: [USDC_TYPE],
        arguments: [
          coinWithBalance({ type: USDC_TYPE, balance: total }),
          tx.pure.address(params.shop),
          tx.pure.u64(BigInt(params.repairId)),
          tx.pure.vector("u64", amounts),
          tx.pure.u64(deadlineMs),
        ],
      });

      const { digest, objectChanges } = await exec(tx);
      const created = objectChanges.find(
        (c): c is { type: "created"; objectId: string; objectType: string } =>
          typeof c === "object" && c !== null &&
          (c as { type?: string }).type === "created" &&
          String((c as { objectType?: string }).objectType ?? "").includes(`${ESCROW_MODULE}::RepairEscrow`)
      );
      if (!created) throw new Error("Escrow object not found in transaction result");

      // Mirror into backend (backend reads authoritative state from chain).
      await EscrowsAPI.index({ escrowObjectId: created.objectId, repairRequestId: params.repairId, txDigest: digest });
      return { escrowObjectId: created.objectId, digest };
    } finally {
      setPending(null);
    }
  }

  /** Shop marks a milestone done (awaiting customer approval). */
  async function submitMilestone(escrowId: string, index: number): Promise<string> {
    setPending(`submit-${index}`);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: Target.submitMilestone,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(escrowId), tx.pure.u64(BigInt(index))],
      });
      const { digest } = await exec(tx);
      return digest;
    } finally {
      setPending(null);
    }
  }

  /** Customer approves a milestone, releasing its funds to the shop. */
  async function approveMilestone(escrowId: string, index: number): Promise<string> {
    setPending(`approve-${index}`);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: Target.approveMilestone,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(escrowId), tx.pure.u64(BigInt(index))],
      });
      const { digest } = await exec(tx);
      return digest;
    } finally {
      setPending(null);
    }
  }

  /** Either party freezes the escrow into a dispute. */
  async function raiseDispute(escrowId: string): Promise<string> {
    setPending("dispute");
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: Target.raiseDispute,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(escrowId)],
      });
      const { digest } = await exec(tx);
      return digest;
    } finally {
      setPending(null);
    }
  }

  /** Customer reclaims funds if the shop never started past the deadline. */
  async function refundIfUnstarted(escrowId: string): Promise<string> {
    setPending("refund");
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: Target.refundIfUnstarted,
        typeArguments: [USDC_TYPE],
        arguments: [tx.object(escrowId), tx.object(CLOCK_ID)],
      });
      const { digest } = await exec(tx);
      return digest;
    } finally {
      setPending(null);
    }
  }

  return {
    account,
    pending,
    createEscrow,
    submitMilestone,
    approveMilestone,
    raiseDispute,
    refundIfUnstarted,
    packageId: PACKAGE_ID,
  };
}
