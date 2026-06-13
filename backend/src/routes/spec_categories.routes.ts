/**
 * SPEC CATEGORIES
 * The labels that group specs — e.g. "Processor", "RAM", "Storage", "GPU".
 *
 * Public  → list categories (used to build filter UI)
 * Admin   → full CRUD
 */

import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** List all active spec categories */
router.get("/", /* SpecCategoryController.list */);

/** Get a single category with its options */
router.get("/:id", /* SpecCategoryController.getOne */);

// ─── Admin only ───────────────────────────────────────────────────────────────

/** Create a new spec category (e.g. "Battery Life") */
router.post("/", authenticate, authorize("admin"), /* SpecCategoryController.create */);

/** Update a spec category name or description */
router.patch("/:id", authenticate, authorize("admin"), /* SpecCategoryController.update */);

/** Deactivate a spec category */
router.delete("/:id", authenticate, authorize("admin"), /* SpecCategoryController.deactivate */);

export default router;
