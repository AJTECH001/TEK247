import { Request, Response } from "express";
import { RepairServiceModel } from "../models/repair_service.model";
import { sendSuccess, sendError } from "../utils/response";
import { RepairType } from "../types";

const VALID_TYPES: RepairType[] = [
  "screen", "battery", "keyboard", "charging_port", "motherboard",
  "software", "virus_removal", "data_recovery", "general_maintenance", "other",
];

export const RepairServiceController = {
  // GET /repair-services
  async list(req: Request, res: Response): Promise<void> {
    try {
      const isAdmin = req.user?.role === "admin";
      const services = await RepairServiceModel.findAll(!isAdmin ? false : true);
      sendSuccess(res, "Repair services retrieved", services);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /repair-services/:id
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid service ID", 400); return; }
      const service = await RepairServiceModel.findById(id);
      if (!service) { sendError(res, "Repair service not found", 404); return; }
      sendSuccess(res, "Repair service retrieved", service);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // POST /repair-services (admin)
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, estimatedPrice, repairType, estimatedDuration } = req.body as {
        name?: string;
        description?: string;
        estimatedPrice?: unknown;
        repairType?: string;
        estimatedDuration?: string;
      };

      if (!name?.trim()) { sendError(res, "name is required", 400); return; }
      if (!repairType || !VALID_TYPES.includes(repairType as RepairType)) {
        sendError(res, `repairType must be one of: ${VALID_TYPES.join(", ")}`, 400); return;
      }
      const price = parseFloat(String(estimatedPrice));
      if (isNaN(price) || price < 0) {
        sendError(res, "estimatedPrice must be a non-negative number", 400); return;
      }

      const service = await RepairServiceModel.create({
        name: name.trim(),
        description: description?.trim(),
        estimatedPrice: price,
        repairType: repairType as RepairType,
        estimatedDuration: estimatedDuration?.trim(),
      });
      sendSuccess(res, "Repair service created", service, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /repair-services/:id (admin)
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid service ID", 400); return; }

      const { name, description, estimatedPrice, estimatedDuration, isActive } = req.body as {
        name?: string;
        description?: string | null;
        estimatedPrice?: unknown;
        estimatedDuration?: string | null;
        isActive?: unknown;
      };

      const price = estimatedPrice !== undefined ? parseFloat(String(estimatedPrice)) : undefined;
      if (price !== undefined && (isNaN(price) || price < 0)) {
        sendError(res, "estimatedPrice must be a non-negative number", 400); return;
      }

      const service = await RepairServiceModel.update(id, {
        name: name?.trim(),
        description,
        estimatedPrice: price,
        estimatedDuration,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      });
      if (!service) { sendError(res, "Repair service not found or no changes provided", 404); return; }
      sendSuccess(res, "Repair service updated", service);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // DELETE /repair-services/:id (admin)
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid service ID", 400); return; }
      const service = await RepairServiceModel.deactivate(id);
      if (!service) { sendError(res, "Repair service not found", 404); return; }
      sendSuccess(res, "Repair service deactivated", service);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
