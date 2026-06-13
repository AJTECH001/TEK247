import { Request, Response } from "express";
import { AccessoryModel } from "../models/accessory.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { AccessoryCategory } from "../types";

const VALID_CATEGORIES: AccessoryCategory[] = [
  "bag", "mouse", "keyboard", "charger", "storage", "hub", "stand", "other",
];

export const AccessoryController = {
  // GET /accessories
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const category = req.query.category as string | undefined;
      const isAdmin = req.user?.role === "admin";

      if (category && !VALID_CATEGORIES.includes(category as AccessoryCategory)) {
        sendError(res, `Category must be one of: ${VALID_CATEGORIES.join(", ")}`, 400);
        return;
      }

      const { accessories, total } = await AccessoryModel.findAll(page, limit, {
        category,
        includeInactive: isAdmin,
      });
      sendSuccess(res, "Accessories retrieved", accessories, 200, buildPaginationMeta(page, limit, total));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // GET /accessories/:id
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid accessory ID", 400); return; }
      const acc = await AccessoryModel.findById(id);
      if (!acc) { sendError(res, "Accessory not found", 404); return; }
      sendSuccess(res, "Accessory retrieved", acc);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // POST /accessories (admin)
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, description, price, quantityInStock } = req.body as {
        name?: string;
        category?: string;
        description?: string;
        price?: unknown;
        quantityInStock?: unknown;
      };

      if (!name || typeof name !== "string" || !name.trim()) {
        sendError(res, "name is required", 400); return;
      }
      if (!category || !VALID_CATEGORIES.includes(category as AccessoryCategory)) {
        sendError(res, `category must be one of: ${VALID_CATEGORIES.join(", ")}`, 400); return;
      }
      const priceNum = parseFloat(String(price));
      if (isNaN(priceNum) || priceNum <= 0) {
        sendError(res, "price must be a positive number", 400); return;
      }

      const qty = quantityInStock !== undefined ? parseInt(String(quantityInStock), 10) : 0;
      const acc = await AccessoryModel.create({
        name: name.trim(),
        category,
        description: description?.trim(),
        price: priceNum,
        quantityInStock: isNaN(qty) ? 0 : qty,
      });
      sendSuccess(res, "Accessory created", acc, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /accessories/:id (admin)
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid accessory ID", 400); return; }

      const { name, description, price, isActive } = req.body as {
        name?: string;
        description?: string | null;
        price?: unknown;
        isActive?: unknown;
      };

      const priceNum = price !== undefined ? parseFloat(String(price)) : undefined;
      if (priceNum !== undefined && (isNaN(priceNum) || priceNum <= 0)) {
        sendError(res, "price must be a positive number", 400); return;
      }

      const acc = await AccessoryModel.update(id, {
        name: name?.trim(),
        description,
        price: priceNum,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      });
      if (!acc) { sendError(res, "Accessory not found or no changes provided", 404); return; }
      sendSuccess(res, "Accessory updated", acc);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // PATCH /accessories/:id/stock (admin)
  async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid accessory ID", 400); return; }

      const qty = parseInt(String(req.body.quantity), 10);
      if (isNaN(qty) || qty < 0) {
        sendError(res, "quantity must be a non-negative integer", 400); return;
      }

      const acc = await AccessoryModel.updateStock(id, qty);
      if (!acc) { sendError(res, "Accessory not found", 404); return; }
      sendSuccess(res, "Stock updated", acc);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // DELETE /accessories/:id (admin)
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid accessory ID", 400); return; }
      const acc = await AccessoryModel.deactivate(id);
      if (!acc) { sendError(res, "Accessory not found", 404); return; }
      sendSuccess(res, "Accessory deactivated", acc);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
