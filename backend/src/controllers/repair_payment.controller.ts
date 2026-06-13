import { Request, Response } from "express";
import { RepairPaymentModel } from "../models/repair_payment.model";
import { RepairModel } from "../models/repair.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";

export const RepairPaymentController = {
  // POST /repair-payments
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { repairRequestId, amountPaid, paymentMethod } = req.body as {
        repairRequestId?: unknown;
        amountPaid?: unknown;
        paymentMethod?: string;
      };

      const rid = parseInt(String(repairRequestId), 10);
      if (isNaN(rid) || rid <= 0) { sendError(res, "repairRequestId must be a valid ID", 400); return; }

      const amount = parseFloat(String(amountPaid));
      if (isNaN(amount) || amount <= 0) { sendError(res, "amountPaid must be a positive number", 400); return; }

      // Verify access
      const repair = await RepairModel.findById(rid);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }
      if (req.user!.role !== "admin" && repair.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }

      const payment = await RepairPaymentModel.create({
        repairRequestId: rid,
        amountPaid: amount,
        paymentMethod,
      });
      sendSuccess(res, "Repair payment recorded", payment, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /repair-payments/repair/:repairId
  async listByRepair(req: Request, res: Response): Promise<void> {
    try {
      const rid = parseInt(req.params.repairId, 10);
      if (isNaN(rid)) { sendError(res, "Invalid repair ID", 400); return; }

      const repair = await RepairModel.findById(rid);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }
      if (req.user!.role !== "admin" && repair.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }

      const payments = await RepairPaymentModel.findByRepair(rid);
      sendSuccess(res, "Repair payments retrieved", payments);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /repair-payments (admin)
  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { payments, total } = await RepairPaymentModel.findAll(page, limit);
      sendSuccess(res, "Repair payments retrieved", payments, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repair-payments/:id/complete (admin)
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid payment ID", 400); return; }
      const payment = await RepairPaymentModel.complete(id);
      if (!payment) { sendError(res, "Payment not found or already processed", 404); return; }
      sendSuccess(res, "Payment marked as completed", payment);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repair-payments/:id/refund (admin)
  async refund(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid payment ID", 400); return; }
      const payment = await RepairPaymentModel.refund(id);
      if (!payment) { sendError(res, "Payment not found or not eligible for refund", 404); return; }
      sendSuccess(res, "Payment refunded", payment);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
