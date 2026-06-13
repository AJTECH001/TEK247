import { Request, Response } from "express";
import { LaptopModel } from "../models/laptop.model";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";

export const LaptopController = {
  // ─── GET / ────────────────────────────────────────────────────────────────────
  // Public: list active laptops. Admin gets ?includeInactive=true option.
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const search   = typeof req.query.search   === "string" ? req.query.search   : undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const includeInactive = req.user?.role === "admin" && req.query.includeInactive === "true";

      const { laptops, total } = await LaptopModel.findAll(page, limit, {
        search,
        minPrice,
        maxPrice,
        includeInactive,
      });
      const meta = buildPaginationMeta(page, limit, total);

      sendSuccess(res, "Laptops retrieved", laptops, 200, meta);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── GET /:id ─────────────────────────────────────────────────────────────────
  // Public: single laptop with all specs
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid laptop ID", 400); return; }

      const laptop = await LaptopModel.findById(id);
      if (!laptop) { sendError(res, "Laptop not found", 404); return; }

      sendSuccess(res, "Laptop retrieved", laptop);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── POST / (admin) ───────────────────────────────────────────────────────────
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, shortSummary, basePrice } = req.body as {
        name?: string;
        shortSummary?: string;
        basePrice?: unknown;
      };

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        sendError(res, "name is required", 400);
        return;
      }

      const price = parseFloat(String(basePrice));
      if (isNaN(price) || price <= 0) {
        sendError(res, "basePrice must be a positive number", 400);
        return;
      }

      const laptop = await LaptopModel.create({
        name: name.trim(),
        shortSummary: shortSummary?.trim(),
        basePrice: price,
      });

      sendSuccess(res, "Laptop created", laptop, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── PATCH /:id (admin) ───────────────────────────────────────────────────────
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid laptop ID", 400); return; }

      const { name, shortSummary, isActive } = req.body as {
        name?: string;
        shortSummary?: string | null;
        isActive?: boolean;
      };

      const updated = await LaptopModel.update(id, { name, shortSummary, isActive });
      if (!updated) { sendError(res, "Laptop not found or no fields to update", 404); return; }

      sendSuccess(res, "Laptop updated", updated);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── PATCH /:id/price (admin) ─────────────────────────────────────────────────
  async updatePrice(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid laptop ID", 400); return; }

      const price = parseFloat(String(req.body.basePrice));
      if (isNaN(price) || price <= 0) {
        sendError(res, "basePrice must be a positive number", 400);
        return;
      }

      const updated = await LaptopModel.updatePrice(id, price, req.user!.userId);
      if (!updated) { sendError(res, "Laptop not found", 404); return; }

      sendSuccess(res, "Price updated", updated);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── POST /:id/specs (admin) ──────────────────────────────────────────────────
  async addSpec(req: Request, res: Response): Promise<void> {
    try {
      const configId = parseInt(req.params.id, 10);
      if (isNaN(configId)) { sendError(res, "Invalid laptop ID", 400); return; }

      const specOptionId = parseInt(String(req.body.specOptionId), 10);
      if (isNaN(specOptionId) || specOptionId <= 0) {
        sendError(res, "specOptionId must be a valid ID", 400);
        return;
      }

      try {
        await LaptopModel.addSpec(configId, specOptionId);
      } catch (dbErr) {
        const msg = (dbErr as Error).message;
        if (msg.includes("unique") || msg.includes("duplicate")) {
          sendError(res, "That spec is already added to this laptop", 409);
          return;
        }
        if (msg.includes("foreign key") || msg.includes("violates")) {
          sendError(res, "Laptop or spec option not found", 404);
          return;
        }
        throw dbErr;
      }

      const laptop = await LaptopModel.findById(configId);
      sendSuccess(res, "Spec added", laptop, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── DELETE /:id/specs/:specOptionId (admin) ──────────────────────────────────
  async removeSpec(req: Request, res: Response): Promise<void> {
    try {
      const configId     = parseInt(req.params.id, 10);
      const specOptionId = parseInt(req.params.specOptionId, 10);

      if (isNaN(configId) || isNaN(specOptionId)) {
        sendError(res, "Invalid ID", 400);
        return;
      }

      const removed = await LaptopModel.removeSpec(configId, specOptionId);
      if (!removed) { sendError(res, "Spec not found on this laptop", 404); return; }

      sendSuccess(res, "Spec removed");
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── GET /:id/price-history (admin) ───────────────────────────────────────────
  async priceHistory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid laptop ID", 400); return; }

      const history = await LaptopModel.priceHistory(id);
      sendSuccess(res, "Price history retrieved", history);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  // ─── DELETE /:id (admin) ──────────────────────────────────────────────────────
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendError(res, "Invalid laptop ID", 400); return; }

      const updated = await LaptopModel.deactivate(id);
      if (!updated) { sendError(res, "Laptop not found", 404); return; }

      sendSuccess(res, "Laptop deactivated", updated);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
