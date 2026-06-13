import { Request, Response } from "express";
import { PaymentModel } from "../models/payment.model";
import { OrderModel } from "../models/order.model";
import { AuditLogModel } from "../models/audit_log.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { PaymentMethod } from "../types";

const VALID_METHODS: PaymentMethod[] = [
  "cash", "transfer", "card", "pos", "bank_deposit", "ussd", "installment", "usdc",
];

export const PaymentController = {
  // POST /payments
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, amountPaid, paymentMethod, transactionReference, paymentProofUrl, notes } = req.body as {
        orderId?: unknown;
        amountPaid?: unknown;
        paymentMethod?: string;
        transactionReference?: string;
        paymentProofUrl?: string;
        notes?: string;
      };

      const oid = parseInt(String(orderId), 10);
      if (isNaN(oid) || oid <= 0) { sendError(res, "orderId must be a valid order ID", 400); return; }

      const amount = parseFloat(String(amountPaid));
      if (isNaN(amount) || amount <= 0) { sendError(res, "amountPaid must be a positive number", 400); return; }

      if (!paymentMethod || !VALID_METHODS.includes(paymentMethod as PaymentMethod)) {
        sendError(res, `paymentMethod must be one of: ${VALID_METHODS.join(", ")}`, 400); return;
      }

      // Verify the order belongs to the user (or user is admin)
      const order = await OrderModel.findById(oid);
      if (!order) { sendError(res, "Order not found", 404); return; }
      if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }
      if (order.status === "cancelled") {
        sendError(res, "Cannot record payment for a cancelled order", 400); return;
      }

      const alreadyPaid = await PaymentModel.sumPaid(oid);
      if (alreadyPaid + amount > order.totalAmount) {
        sendError(
          res,
          `Payment would exceed order total. Already paid: ${alreadyPaid}, order total: ${order.totalAmount}`,
          400
        );
        return;
      }

      const payment = await PaymentModel.create({
        orderId: oid,
        amountPaid: amount,
        paymentMethod: paymentMethod as PaymentMethod,
        transactionReference,
        paymentProofUrl,
        notes,
      });
      sendSuccess(res, "Payment recorded", payment, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /payments/order/:orderId
  async listByOrder(req: Request, res: Response): Promise<void> {
    try {
      const oid = parseInt(req.params.orderId, 10);
      if (isNaN(oid)) { sendError(res, "Invalid order ID", 400); return; }

      // Verify access
      const order = await OrderModel.findById(oid);
      if (!order) { sendError(res, "Order not found", 404); return; }
      if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }

      const payments = await PaymentModel.findByOrder(oid);
      sendSuccess(res, "Payments retrieved", payments);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /payments (admin)
  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;

      const { payments, total } = await PaymentModel.findAll(page, limit, { status });
      sendSuccess(res, "Payments retrieved", payments, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /payments/:id/verify (admin)
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid payment ID", 400); return; }

      const payment = await PaymentModel.verify(id, req.user!.userId);
      if (!payment) { sendError(res, "Payment not found or already processed", 404); return; }

      // Audit Log
      await AuditLogModel.create({
        adminId: req.user!.userId,
        action: "VERIFY_PAYMENT",
        targetType: "payment",
        targetId: String(id),
        changes: { status: "completed" },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      sendSuccess(res, "Payment verified", payment);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /payments/:id/refund (admin)
  async refund(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid payment ID", 400); return; }

      const payment = await PaymentModel.refund(id);
      if (!payment) { sendError(res, "Payment not found or not eligible for refund", 404); return; }

      // Audit Log
      await AuditLogModel.create({
        adminId: req.user!.userId,
        action: "REFUND_PAYMENT",
        targetType: "payment",
        targetId: String(id),
        changes: { status: "refunded", reason: req.body.reason },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      sendSuccess(res, "Payment refunded", payment);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
