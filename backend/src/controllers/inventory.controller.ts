import { Request, Response } from "express";
import { InventoryModel } from "../models/inventory.model";
import { sendSuccess, sendError } from "../utils/response";

export const InventoryController = {
  // GET /inventory
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const inventory = await InventoryModel.findAll();
      sendSuccess(res, "Inventory retrieved", inventory);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /inventory/:configurationId
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const configId = parseInt(req.params.configurationId, 10);
      if (isNaN(configId)) { sendError(res, "Invalid configuration ID", 400); return; }
      const item = await InventoryModel.findByConfigId(configId);
      if (!item) { sendError(res, "Inventory record not found", 404); return; }
      sendSuccess(res, "Inventory retrieved", item);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /inventory/:configurationId
  async update(req: Request, res: Response): Promise<void> {
    try {
      const configId = parseInt(req.params.configurationId, 10);
      if (isNaN(configId)) { sendError(res, "Invalid configuration ID", 400); return; }

      const { quantityInStock, restockThreshold } = req.body as {
        quantityInStock?: unknown;
        restockThreshold?: unknown;
      };

      const qty = parseInt(String(quantityInStock), 10);
      if (isNaN(qty) || qty < 0) {
        sendError(res, "quantityInStock must be a non-negative integer", 400); return;
      }

      const threshold = restockThreshold !== undefined
        ? parseInt(String(restockThreshold), 10)
        : undefined;
      if (threshold !== undefined && (isNaN(threshold) || threshold < 0)) {
        sendError(res, "restockThreshold must be a non-negative integer", 400); return;
      }

      const item = await InventoryModel.upsert(configId, qty, threshold);
      sendSuccess(res, "Inventory updated", item);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
