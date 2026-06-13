import { Request, Response } from "express";
import { SystemRequestModel } from "../models/system_request.model";
import { LaptopModel } from "../models/laptop.model";
import { NotificationModel } from "../models/notification.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { SystemRequestStatus } from "../types";

const VALID_STATUSES: SystemRequestStatus[] = ["pending", "recommended", "purchased", "closed"];

export const SystemRequestController = {
  // ─── POST / ───────────────────────────────────────────────────────────────────
  // User submits a new system request
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { description, budgetMin, budgetMax } = req.body as {
        description?: string;
        budgetMin?: unknown;
        budgetMax?: unknown;
      };

      if (!description || typeof description !== "string" || description.trim().length === 0) {
        sendError(res, "Description is required", 400);
        return;
      }
      if (description.trim().length > 2000) {
        sendError(res, "Description must not exceed 2000 characters", 400);
        return;
      }

      const min = budgetMin !== undefined ? parseFloat(String(budgetMin)) : null;
      const max = budgetMax !== undefined ? parseFloat(String(budgetMax)) : null;

      if (min !== null && (isNaN(min) || min < 0)) {
        sendError(res, "budgetMin must be a positive number", 400);
        return;
      }
      if (max !== null && (isNaN(max) || max < 0)) {
        sendError(res, "budgetMax must be a positive number", 400);
        return;
      }
      if (min !== null && max !== null && min > max) {
        sendError(res, "budgetMin cannot be greater than budgetMax", 400);
        return;
      }

      const request = await SystemRequestModel.create(req.user!.userId, description.trim(), min, max);
      sendSuccess(res, "System request submitted", request, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── GET / ────────────────────────────────────────────────────────────────────
  // User → own requests | Admin → all requests (with user info)
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const isAdmin = req.user!.role === "admin";
      const userId  = isAdmin ? undefined : req.user!.userId;

      const { requests, total } = await SystemRequestModel.findAll(page, limit, userId);
      const meta = buildPaginationMeta(page, limit, total);

      sendSuccess(res, "System requests retrieved", requests, 200, meta);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── GET /:id ─────────────────────────────────────────────────────────────────
  // Returns the request with its recommendations (+ laptop details)
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid request ID", 400); return; }

      const row = await SystemRequestModel.findById(id);
      if (!row) { sendError(res, "System request not found", 404); return; }

      // Users can only view their own requests
      if (req.user!.role !== "admin" && row.user_id !== req.user!.userId) {
        sendError(res, "Forbidden", 403);
        return;
      }

      const recommendations = await SystemRequestModel.getRecommendationsWithLaptops(id);

      // Build safe response manually so we can include user info for admin
      const result = {
        id: row.id,
        userId: row.user_id,
        description: row.description,
        budgetMin: row.budget_min !== null ? parseFloat(row.budget_min) : null,
        budgetMax: row.budget_max !== null ? parseFloat(row.budget_max) : null,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        recommendations,
      };

      sendSuccess(res, "System request retrieved", result);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── PATCH /:id/close ─────────────────────────────────────────────────────────
  // User closes their own request
  async close(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid request ID", 400); return; }

      const row = await SystemRequestModel.findById(id);
      if (!row) { sendError(res, "System request not found", 404); return; }

      // Users can only close their own; admins can close any
      if (req.user!.role !== "admin" && row.user_id !== req.user!.userId) {
        sendError(res, "Forbidden", 403);
        return;
      }

      if (row.status === "closed") {
        sendError(res, "Request is already closed", 400);
        return;
      }

      const updated = await SystemRequestModel.updateStatus(id, "closed");
      sendSuccess(res, "System request closed", updated);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── POST /:id/recommendations (admin) ────────────────────────────────────────
  // Admin adds a ranked laptop recommendation to a request
  async addRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (isNaN(requestId)) { sendError(res, "Invalid request ID", 400); return; }

      const { configurationId, rank, reason } = req.body as {
        configurationId?: unknown;
        rank?: unknown;
        reason?: string;
      };

      const configId = parseInt(String(configurationId), 10);
      const rankNum  = parseInt(String(rank), 10);

      if (isNaN(configId) || configId <= 0) {
        sendError(res, "configurationId must be a valid laptop ID", 400);
        return;
      }
      if (isNaN(rankNum) || rankNum < 1) {
        sendError(res, "rank must be a positive integer", 400);
        return;
      }

      const [row, laptop] = await Promise.all([
        SystemRequestModel.findById(requestId),
        LaptopModel.findById(configId),
      ]);

      if (!row) { sendError(res, "System request not found", 404); return; }
      if (!laptop) { sendError(res, "Laptop configuration not found", 404); return; }
      if (!laptop.isActive) { sendError(res, "Laptop configuration is no longer active", 400); return; }
      if (row.status === "closed" || row.status === "purchased") {
        sendError(res, `Cannot add recommendation to a ${row.status} request`, 400);
        return;
      }

      let recommendation;
      try {
        recommendation = await SystemRequestModel.addRecommendation(
          requestId,
          configId,
          rankNum,
          reason?.trim() ?? null
        );
      } catch (dbErr) {
        const msg = (dbErr as Error).message;
        if (msg.includes("unique") || msg.includes("duplicate")) {
          sendError(res, "That laptop or rank is already used for this request", 409);
          return;
        }
        throw dbErr;
      }

      // Auto-advance status to "recommended" if still pending
      if (row.status === "pending") {
        await SystemRequestModel.updateStatus(requestId, "recommended");
      }

      // Notify the user
      NotificationModel.create(
        row.user_id,
        "Laptop recommendation ready",
        `Your system request has been reviewed and a laptop recommendation is ready for you. Log in to view your options.`,
        "system_recommendation",
        "system_request",
        requestId
      ).catch(() => {/* swallow — non-critical */});

      sendSuccess(res, "Recommendation added", {
        ...recommendation,
        laptop: { id: laptop.id, name: laptop.name, basePrice: laptop.basePrice },
      }, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── DELETE /:id/recommendations/:recommendationId (admin) ───────────────────
  async removeRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const requestId        = parseInt(req.params.id, 10);
      const recommendationId = parseInt(req.params.recommendationId, 10);

      if (isNaN(requestId) || isNaN(recommendationId)) {
        sendError(res, "Invalid ID", 400);
        return;
      }

      const row = await SystemRequestModel.findById(requestId);
      if (!row) { sendError(res, "System request not found", 404); return; }

      const deleted = await SystemRequestModel.removeRecommendation(recommendationId, requestId);
      if (!deleted) { sendError(res, "Recommendation not found", 404); return; }

      // If no recommendations remain and status is "recommended", revert to "pending"
      if (row.status === "recommended") {
        const remaining = await SystemRequestModel.countRecommendations(requestId);
        if (remaining === 0) {
          await SystemRequestModel.updateStatus(requestId, "pending");
        }
      }

      sendSuccess(res, "Recommendation removed");
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── PATCH /:id/status (admin) ────────────────────────────────────────────────
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid request ID", 400); return; }

      const { status } = req.body as { status?: string };

      if (!status || !VALID_STATUSES.includes(status as SystemRequestStatus)) {
        sendError(res, `Status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
        return;
      }

      const row = await SystemRequestModel.findById(id);
      if (!row) { sendError(res, "System request not found", 404); return; }

      const updated = await SystemRequestModel.updateStatus(id, status as SystemRequestStatus);
      sendSuccess(res, "Status updated", updated);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
