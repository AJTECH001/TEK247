/**
 * LAPTOP CONFIGURATIONS
 * The main products in the store — pre-built laptop setups with specs.
 *
 * Public  → browse laptops, view specs, view price history
 * Admin   → create, edit, delete laptops, manage their specs, update prices
 */

import { Router } from "express";
import { body, param, query } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { LaptopController } from "../controllers/laptop.controller";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** List all active laptops (with optional filters: minPrice, maxPrice, search) */
router.get(
  "/",
  [
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("minPrice must be a non-negative number"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("maxPrice must be a non-negative number"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Search query must be under 200 characters"),
    validate,
  ],
  LaptopController.list
);

/** Get a single laptop with all its spec options */
router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"), validate],
  LaptopController.getOne
);

// ─── Admin only ───────────────────────────────────────────────────────────────

/** Create a new laptop configuration */
router.post(
  "/",
  authenticate,
  authorize("MANAGE_SYSTEM"),
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Laptop name is required")
      .isLength({ max: 200 })
      .withMessage("Name must be under 200 characters"),
    body("shortSummary")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Short summary must be under 500 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("stockQuantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stock quantity must be a non-negative integer"),
    validate,
  ],
  LaptopController.create
);

/** Update laptop details (name, summary, active status) */
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"),
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ max: 200 })
      .withMessage("Name must be under 200 characters"),
    body("shortSummary")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Short summary must be under 500 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    validate,
  ],
  LaptopController.update
);

/** Update the price — automatically saves old price to price_history */
router.patch(
  "/:id/price",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("note")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Note must be under 500 characters"),
    validate,
  ],
  LaptopController.updatePrice
);

/** Add a spec option to a laptop configuration */
router.post(
  "/:id/specs",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"),
    body("specOptionId")
      .isInt({ min: 1 })
      .withMessage("A valid spec option ID is required"),
    validate,
  ],
  LaptopController.addSpec
);

/** Remove a spec option from a laptop configuration */
router.delete(
  "/:id/specs/:specOptionId",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"),
    param("specOptionId")
      .isInt({ min: 1 })
      .withMessage("Invalid spec option ID"),
    validate,
  ],
  LaptopController.removeSpec
);

/** View full price history for a laptop */
router.get(
  "/:id/price-history",
  authenticate,
  authorize("admin"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"), validate],
  LaptopController.priceHistory
);

/** Soft-delete (deactivate) a laptop */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid laptop ID"), validate],
  LaptopController.deactivate
);

export default router;
