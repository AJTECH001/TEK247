import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { AuditLogModel } from "../models/audit_log.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";

export const AdminController = {
  // GET /api/v1/admin/users?page=1&limit=10
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const { users, total } = await UserModel.findAll(page, limit);
      const meta = buildPaginationMeta(page, limit, total);

      sendSuccess(res, "Users retrieved", users, 200, meta);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /api/v1/admin/users/:id
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        sendError(res, "Invalid user ID", 400);
        return;
      }

      const user = await UserModel.findById(id);
      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      const { password_hash: _omit, ...safeFields } = user;
      sendSuccess(res, "User retrieved", safeFields);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /api/v1/admin/users/:id/role
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        sendError(res, "Invalid user ID", 400);
        return;
      }

      if (id === req.user!.userId) {
        sendError(res, "You cannot change your own role", 400);
        return;
      }

      const { role } = req.body as { role: "user" | "admin" };
      const updated = await UserModel.updateRole(id, role);
      if (!updated) {
        sendError(res, "User not found", 404);
        return;
      }

      // Audit Log
      await AuditLogModel.create({
        adminId: req.user!.userId,
        action: "UPDATE_USER_ROLE",
        targetType: "user",
        targetId: String(id),
        changes: { newRole: role },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      sendSuccess(res, `User role updated to ${role}`, {
        id: updated.id,
        email: updated.email,
        role: updated.role,
      });
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /api/v1/admin/users/:id/status
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        sendError(res, "Invalid user ID", 400);
        return;
      }

      if (id === req.user!.userId) {
        sendError(res, "You cannot change your own status", 400);
        return;
      }

      const { status } = req.body as { status: "active" | "inactive" | "suspended" };
      const updated = await UserModel.updateStatus(id, status);
      if (!updated) {
        sendError(res, "User not found", 404);
        return;
      }

      // Audit Log
      await AuditLogModel.create({
        adminId: req.user!.userId,
        action: "UPDATE_USER_STATUS",
        targetType: "user",
        targetId: String(id),
        changes: { newStatus: status },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      sendSuccess(res, `User status updated to ${status}`, {
        id: updated.id,
        email: updated.email,
        status: updated.status,
      });
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
