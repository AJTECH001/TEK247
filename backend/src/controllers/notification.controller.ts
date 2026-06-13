import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { NotificationType } from "../types";

const VALID_TYPES: NotificationType[] = [
  "repair_status", "order_status", "price_drop", "system_recommendation", "system",
];

export const NotificationController = {
  // GET /notifications
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { notifications, total } = await NotificationModel.findByUser(req.user!.userId, page, limit);
      sendSuccess(res, "Notifications retrieved", notifications, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /notifications/unread-count
  async unreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationModel.unreadCount(req.user!.userId);
      sendSuccess(res, "Unread count retrieved", { count });
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /notifications/:id/read
  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid notification ID", 400); return; }
      const ok = await NotificationModel.markRead(id, req.user!.userId);
      if (!ok) { sendError(res, "Notification not found", 404); return; }
      sendSuccess(res, "Notification marked as read");
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /notifications/read-all
  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      await NotificationModel.markAllRead(req.user!.userId);
      sendSuccess(res, "All notifications marked as read");
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // POST /notifications/send (admin)
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, message, type, relatedEntityType, relatedEntityId } = req.body as {
        userId?: unknown;
        title?: string;
        message?: string;
        type?: string;
        relatedEntityType?: string;
        relatedEntityId?: unknown;
      };

      const uid = parseInt(String(userId), 10);
      if (isNaN(uid) || uid <= 0) { sendError(res, "userId must be a valid user ID", 400); return; }
      if (!title?.trim()) { sendError(res, "title is required", 400); return; }
      if (!message?.trim()) { sendError(res, "message is required", 400); return; }
      if (!type || !VALID_TYPES.includes(type as NotificationType)) {
        sendError(res, `type must be one of: ${VALID_TYPES.join(", ")}`, 400); return;
      }

      const entityId = relatedEntityId !== undefined
        ? parseInt(String(relatedEntityId), 10)
        : undefined;

      const notification = await NotificationModel.create(
        uid,
        title.trim(),
        message.trim(),
        type as NotificationType,
        relatedEntityType,
        entityId && !isNaN(entityId) ? entityId : undefined
      );
      sendSuccess(res, "Notification sent", notification, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
