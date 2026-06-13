import { Request, Response } from "express";
import { RepairModel } from "../models/repair.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { RepairStatus } from "../types";

const VALID_STATUSES: RepairStatus[] = [
  "pending", "diagnosed", "in_progress", "completed", "cancelled", "awaiting_parts",
];

const VALID_TRANSITIONS: Record<RepairStatus, RepairStatus[]> = {
  pending:        ["diagnosed",   "cancelled"],
  diagnosed:      ["in_progress", "awaiting_parts", "cancelled"],
  awaiting_parts: ["in_progress", "cancelled"],
  in_progress:    ["completed",   "awaiting_parts", "cancelled"],
  completed:      [],
  cancelled:      [],
};

export const RepairController = {
  // POST /repairs
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { laptopBrand, laptopModel, issueDescription, repairServiceId } = req.body as {
        laptopBrand?: string;
        laptopModel?: string;
        issueDescription?: string;
        repairServiceId?: unknown;
      };

      if (!issueDescription?.trim()) {
        sendError(res, "issueDescription is required", 400); return;
      }
      if (issueDescription.trim().length > 2000) {
        sendError(res, "issueDescription must not exceed 2000 characters", 400); return;
      }

      const serviceId = repairServiceId !== undefined
        ? parseInt(String(repairServiceId), 10)
        : undefined;
      if (serviceId !== undefined && isNaN(serviceId)) {
        sendError(res, "repairServiceId must be a valid ID", 400); return;
      }

      const repair = await RepairModel.create({
        userId: req.user!.userId,
        laptopBrand: laptopBrand?.trim(),
        laptopModel: laptopModel?.trim(),
        issueDescription: issueDescription.trim(),
        repairServiceId: serviceId,
      });
      sendSuccess(res, "Repair request submitted", repair, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /repairs
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const status = req.query.status as string | undefined;
      const isAdmin = req.user!.role === "admin";

      if (status && !VALID_STATUSES.includes(status as RepairStatus)) {
        sendError(res, `status must be one of: ${VALID_STATUSES.join(", ")}`, 400); return;
      }

      const { repairs, total } = await RepairModel.findAll(page, limit, {
        userId: isAdmin ? undefined : req.user!.userId,
        status,
      });
      sendSuccess(res, "Repair requests retrieved", repairs, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /repairs/:id
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid repair ID", 400); return; }

      const repair = await RepairModel.findById(id);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }

      if (req.user!.role !== "admin" && repair.userId !== req.user!.userId) {
        sendError(res, "Forbidden", 403); return;
      }
      sendSuccess(res, "Repair request retrieved", repair);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repairs/:id/diagnose (admin)
  async diagnose(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid repair ID", 400); return; }

      const existing = await RepairModel.findById(id);
      if (!existing) { sendError(res, "Repair request not found", 404); return; }
      if (existing.status !== "pending") {
        sendError(res, `Cannot diagnose a repair with status '${existing.status}'`, 400); return;
      }

      const { repairServiceId, estimatedCost } = req.body as {
        repairServiceId?: unknown;
        estimatedCost?: unknown;
      };

      const serviceId = repairServiceId !== undefined ? parseInt(String(repairServiceId), 10) : null;
      const cost      = estimatedCost   !== undefined ? parseFloat(String(estimatedCost))    : null;

      if (cost !== null && (isNaN(cost) || cost < 0)) {
        sendError(res, "estimatedCost must be a non-negative number", 400); return;
      }

      const repair = await RepairModel.diagnose(id, req.user!.userId, serviceId, cost);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }
      sendSuccess(res, "Repair diagnosed", repair);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repairs/:id/status (admin)
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid repair ID", 400); return; }

      const { status } = req.body as { status?: string };
      if (!status || !VALID_STATUSES.includes(status as RepairStatus)) {
        sendError(res, `status must be one of: ${VALID_STATUSES.join(", ")}`, 400); return;
      }

      const current = await RepairModel.findById(id);
      if (!current) { sendError(res, "Repair request not found", 404); return; }

      const allowed = VALID_TRANSITIONS[current.status];
      if (!allowed.includes(status as RepairStatus)) {
        sendError(res, `Cannot transition from '${current.status}' to '${status}'`, 400); return;
      }

      const repair = await RepairModel.updateStatus(id, status as RepairStatus);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }
      sendSuccess(res, "Repair status updated", repair);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repairs/:id/final-cost (admin)
  async setFinalCost(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid repair ID", 400); return; }

      const cost = parseFloat(String(req.body.finalCost));
      if (isNaN(cost) || cost < 0) {
        sendError(res, "finalCost must be a non-negative number", 400); return;
      }

      const repair = await RepairModel.setFinalCost(id, cost);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }
      sendSuccess(res, "Final cost set", repair);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repairs/:id/assign (admin)
  async assign(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid repair ID", 400); return; }

      const techId = parseInt(String(req.body.technicianId), 10);
      if (isNaN(techId) || techId <= 0) {
        sendError(res, "technicianId must be a valid user ID", 400); return;
      }

      const repair = await RepairModel.assign(id, techId);
      if (!repair) { sendError(res, "Repair request not found", 404); return; }
      sendSuccess(res, "Technician assigned", repair);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
