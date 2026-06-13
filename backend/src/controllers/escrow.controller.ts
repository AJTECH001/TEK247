import { Request, Response } from "express";
import { OnChainEscrowModel } from "../models/onchain_escrow.model";
import { getEscrowState, resolveDispute } from "../services/escrow.service";
import { sendSuccess, sendError } from "../utils/response";

export const EscrowController = {
  /**
   * Record a freshly created on-chain escrow (called by the frontend right after
   * the customer executes the funding tx). We read authoritative state from chain
   * and mirror it — never trusting client-supplied amounts.
   */
  async index(req: Request, res: Response): Promise<void> {
    try {
      const { escrowObjectId, repairRequestId, txDigest } = req.body as {
        escrowObjectId?: string; repairRequestId?: number; txDigest?: string;
      };
      if (!escrowObjectId || typeof escrowObjectId !== "string") {
        sendError(res, "escrowObjectId is required", 400); return;
      }
      const state = await getEscrowState(escrowObjectId);
      if (!state) { sendError(res, "Escrow object not found on-chain", 404); return; }

      const saved = await OnChainEscrowModel.upsert({
        escrowObjectId: state.objectId,
        repairRequestId: repairRequestId ?? null,
        customerAddress: state.customer,
        shopAddress: state.shop,
        coinType: state.coinType,
        totalAmount: state.total,
        releasedAmount: state.released,
        status: state.status,
        txDigest,
        isCreate: true,
      });
      sendSuccess(res, "Escrow indexed", { ...saved, milestones: state.milestones }, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  /** Fresh authoritative read straight from the chain object. */
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { objectId } = req.params;
      const state = await getEscrowState(objectId);
      if (!state) { sendError(res, "Escrow not found", 404); return; }
      sendSuccess(res, "Escrow state", state);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  /** Mirrored escrows for a repair request (fast list, no RPC). */
  async listByRepair(req: Request, res: Response): Promise<void> {
    try {
      const rid = parseInt(req.params.repairId, 10);
      if (isNaN(rid)) { sendError(res, "Invalid repair ID", 400); return; }
      const escrows = await OnChainEscrowModel.findByRepair(rid);
      sendSuccess(res, "Escrows retrieved", escrows);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  /** Admin/arbiter: resolve a disputed escrow by splitting funds (on-chain). */
  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const { objectId } = req.params;
      const { customerBps } = req.body as { customerBps?: number };
      if (typeof customerBps !== "number" || customerBps < 0 || customerBps > 10_000) {
        sendError(res, "customerBps must be a number between 0 and 10000", 400); return;
      }
      const state = await getEscrowState(objectId);
      if (!state) { sendError(res, "Escrow not found", 404); return; }
      if (state.status !== "disputed") { sendError(res, "Escrow is not in a disputed state", 409); return; }

      const digest = await resolveDispute(objectId, state.coinType, customerBps);
      const fresh = await getEscrowState(objectId);
      await OnChainEscrowModel.upsert({
        escrowObjectId: objectId,
        releasedAmount: fresh?.released,
        status: fresh?.status,
        txDigest: digest,
      });
      sendSuccess(res, "Dispute resolved on-chain", { digest, status: fresh?.status });
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
