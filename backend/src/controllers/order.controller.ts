import { Request, Response } from "express";
import { OrderModel } from "../models/order.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { OrderStatus } from "../types";

const VALID_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped",   "cancelled"],
  shipped:   ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const OrderController = {
  // POST /orders
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { systemRequestId, items, accessories } = req.body as {
        systemRequestId?: unknown;
        items?: unknown;
        accessories?: unknown;
      };

      if (!Array.isArray(items) || items.length === 0) {
        sendError(res, "items must be a non-empty array", 400); return;
      }

      for (const item of items as { configurationId?: unknown; quantity?: unknown }[]) {
        const cid = parseInt(String(item.configurationId), 10);
        const qty = parseInt(String(item.quantity ?? 1), 10);
        if (isNaN(cid) || cid <= 0) { sendError(res, "Each item must have a valid configurationId", 400); return; }
        if (isNaN(qty) || qty <= 0)  { sendError(res, "Each item quantity must be a positive integer", 400); return; }
      }

      const normalizedItems = (items as { configurationId: unknown; quantity?: unknown }[]).map((i) => ({
        configurationId: parseInt(String(i.configurationId), 10),
        quantity: parseInt(String(i.quantity ?? 1), 10),
      }));

      const normalizedAccs: { accessoryId: number; quantity: number }[] = [];
      if (Array.isArray(accessories)) {
        for (const acc of accessories as { accessoryId?: unknown; quantity?: unknown }[]) {
          const aid = parseInt(String(acc.accessoryId), 10);
          const qty = parseInt(String(acc.quantity ?? 1), 10);
          if (isNaN(aid) || aid <= 0) { sendError(res, "Each accessory must have a valid accessoryId", 400); return; }
          if (isNaN(qty) || qty <= 0) { sendError(res, "Each accessory quantity must be a positive integer", 400); return; }
          normalizedAccs.push({ accessoryId: aid, quantity: qty });
        }
      }

      const srId = systemRequestId !== undefined
        ? parseInt(String(systemRequestId), 10)
        : null;

      const order = await OrderModel.create(
        req.user!.userId,
        srId && !isNaN(srId) ? srId : null,
        normalizedItems,
        normalizedAccs
      );
      sendSuccess(res, "Order placed successfully", order, 201);
    } catch (err) {
      const msg = (err as Error).message;
      const status = msg.includes("not found") || msg.includes("inactive") ? 404
                   : msg.includes("Not enough stock") ? 409
                   : 500;
      sendError(res, msg, status);
    }
  },

  // GET /orders
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const status = req.query.status as string | undefined;
      const isAdmin = req.user!.role === "admin";

      if (status && !VALID_STATUSES.includes(status as OrderStatus)) {
        sendError(res, `status must be one of: ${VALID_STATUSES.join(", ")}`, 400); return;
      }

      const { orders, total } = await OrderModel.findAll(page, limit, {
        userId: isAdmin ? undefined : req.user!.userId,
        status,
      });
      sendSuccess(res, "Orders retrieved", orders, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /orders/:id
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid order ID", 400); return; }

      const order = await OrderModel.findById(id);
      if (!order) { sendError(res, "Order not found", 404); return; }

      if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }
      sendSuccess(res, "Order retrieved", order);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /orders/:id/status (admin)
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid order ID", 400); return; }

      const { status } = req.body as { status?: string };
      if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
        sendError(res, `status must be one of: ${VALID_STATUSES.join(", ")}`, 400); return;
      }

      const current = await OrderModel.findById(id);
      if (!current) { sendError(res, "Order not found", 404); return; }

      const allowed = VALID_TRANSITIONS[current.status];
      if (!allowed.includes(status as OrderStatus)) {
        sendError(res, `Cannot transition from '${current.status}' to '${status}'`, 400); return;
      }

      // Cancellation also restores inventory
      const order = status === "cancelled"
        ? await OrderModel.cancel(id)
        : await OrderModel.updateStatus(id, status as OrderStatus);

      if (!order) { sendError(res, "Order not found", 404); return; }
      sendSuccess(res, "Order status updated", order);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /orders/:id/cancel (admin)
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid order ID", 400); return; }

      const current = await OrderModel.findById(id);
      if (!current) { sendError(res, "Order not found", 404); return; }
      if (current.status === "cancelled") { sendError(res, "Order is already cancelled", 400); return; }
      if (current.status === "delivered") { sendError(res, "Cannot cancel a delivered order", 400); return; }

      const order = await OrderModel.cancel(id);
      sendSuccess(res, "Order cancelled", order);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
