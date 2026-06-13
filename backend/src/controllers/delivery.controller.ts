import { Request, Response } from "express";
import { DeliveryModel } from "../models/delivery.model";
import { OrderModel } from "../models/order.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { DeliveryStatus, DeliveryMethod } from "../types";

const VALID_STATUSES: DeliveryStatus[] = [
  "pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned",
];
const VALID_METHODS: DeliveryMethod[] = [
  "pickup", "courier", "dispatch_rider", "shipping_company",
];

export const DeliveryController = {
  // GET /deliveries/order/:orderId
  async getByOrder(req: Request, res: Response): Promise<void> {
    try {
      const oid = parseInt(req.params.orderId, 10);
      if (isNaN(oid)) { sendError(res, "Invalid order ID", 400); return; }

      const order = await OrderModel.findById(oid);
      if (!order) { sendError(res, "Order not found", 404); return; }
      if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }

      const delivery = await DeliveryModel.findByOrder(oid);
      if (!delivery) { sendError(res, "No delivery found for this order", 404); return; }
      sendSuccess(res, "Delivery retrieved", delivery);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // POST /deliveries (admin)
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        orderId, deliveryMethod, recipientName, recipientPhone, deliveryAddress,
        deliveryState, deliveryLga, courierName, trackingNumber, estimatedDeliveryDate, deliveryNotes,
      } = req.body as {
        orderId?: unknown;
        deliveryMethod?: string;
        recipientName?: string;
        recipientPhone?: string;
        deliveryAddress?: string;
        deliveryState?: string;
        deliveryLga?: string;
        courierName?: string;
        trackingNumber?: string;
        estimatedDeliveryDate?: string;
        deliveryNotes?: string;
      };

      const oid = parseInt(String(orderId), 10);
      if (isNaN(oid) || oid <= 0) { sendError(res, "orderId is required", 400); return; }
      if (!deliveryMethod || !VALID_METHODS.includes(deliveryMethod as DeliveryMethod)) {
        sendError(res, `deliveryMethod must be one of: ${VALID_METHODS.join(", ")}`, 400); return;
      }
      if (!recipientName?.trim()) { sendError(res, "recipientName is required", 400); return; }
      if (!recipientPhone?.trim()) { sendError(res, "recipientPhone is required", 400); return; }
      if (!deliveryAddress?.trim()) { sendError(res, "deliveryAddress is required", 400); return; }

      const delivery = await DeliveryModel.create({
        orderId: oid,
        deliveryMethod: deliveryMethod as DeliveryMethod,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryState,
        deliveryLga,
        courierName,
        trackingNumber,
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
        deliveryNotes,
      });
      sendSuccess(res, "Delivery created", delivery, 201);
    } catch (err) {
      const msg = (err as Error).message;
      const status = msg.includes("unique") || msg.includes("duplicate") ? 409 : 500;
      sendError(res, status === 409 ? "A delivery already exists for this order" : msg, status);
    }
  },

  // GET /deliveries (admin)
  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const dstatus = req.query.status as string | undefined;
      const state  = req.query.state  as string | undefined;

      const { deliveries, total } = await DeliveryModel.findAll(page, limit, { status: dstatus, state });
      sendSuccess(res, "Deliveries retrieved", deliveries, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /deliveries/:id (admin)
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid delivery ID", 400); return; }
      const delivery = await DeliveryModel.findById(id);
      if (!delivery) { sendError(res, "Delivery not found", 404); return; }
      sendSuccess(res, "Delivery retrieved", delivery);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /deliveries/:id/status (admin)
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid delivery ID", 400); return; }

      const { status, location, notes, deliveredTo } = req.body as {
        status?: string;
        location?: string;
        notes?: string;
        deliveredTo?: string;
      };

      if (!status || !VALID_STATUSES.includes(status as DeliveryStatus)) {
        sendError(res, `status must be one of: ${VALID_STATUSES.join(", ")}`, 400); return;
      }

      const delivery = await DeliveryModel.updateStatus(id, status as DeliveryStatus, {
        location,
        notes,
        updatedBy: req.user!.userId,
        deliveredTo,
      });
      if (!delivery) { sendError(res, "Delivery not found", 404); return; }
      sendSuccess(res, "Delivery status updated", delivery);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // POST /deliveries/:id/updates (admin)
  async addUpdate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid delivery ID", 400); return; }

      const { status, location, notes } = req.body as {
        status?: string;
        location?: string;
        notes?: string;
      };

      if (!status || !VALID_STATUSES.includes(status as DeliveryStatus)) {
        sendError(res, `status must be one of: ${VALID_STATUSES.join(", ")}`, 400); return;
      }

      const update = await DeliveryModel.addUpdate(
        id,
        status as DeliveryStatus,
        location ?? null,
        notes ?? null,
        req.user!.userId
      );
      sendSuccess(res, "Delivery update added", update, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /deliveries/:id/assign (admin)
  async assign(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid delivery ID", 400); return; }

      const { assignedTo, courierName, trackingNumber } = req.body as {
        assignedTo?: unknown;
        courierName?: string;
        trackingNumber?: string;
      };

      const assignId = parseInt(String(assignedTo), 10);
      if (isNaN(assignId) || assignId <= 0) {
        sendError(res, "assignedTo must be a valid user ID", 400); return;
      }

      const delivery = await DeliveryModel.assign(id, assignId, courierName, trackingNumber);
      if (!delivery) { sendError(res, "Delivery not found", 404); return; }
      sendSuccess(res, "Delivery assigned", delivery);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
