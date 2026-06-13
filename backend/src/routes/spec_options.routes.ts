/**
 * SPEC OPTIONS
 * The actual values under each category.
 * e.g. Processor → "Intel Core i5", "Intel Core i7", "AMD Ryzen 5"
 *      Screen Size → "13.3 inch", "14.0 inch", "15.6 inch"
 *
 * Public  → list options by category (used to build filter dropdowns)
 * Admin   → full CRUD
 */

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** List all active spec options, optionally filtered by ?categoryId=x */
router.get("/", /* SpecOptionController.list */);

/** Get a single spec option */
router.get("/:id", /* SpecOptionController.getOne */);

// ─── Admin only ───────────────────────────────────────────────────────────────

/** Create a new spec option under a category */
router.post("/", authenticate, authorize("admin"), /* SpecOptionController.create */);

/** Update a spec option name or description */
router.patch("/:id", authenticate, authorize("admin"), /* SpecOptionController.update */);

/** Deactivate a spec option */
router.delete("/:id", authenticate, authorize("admin"), /* SpecOptionController.deactivate */);

export default router;
