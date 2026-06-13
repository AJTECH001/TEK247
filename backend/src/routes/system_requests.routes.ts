/**
 * SYSTEM REQUESTS  (the "Personal Shopper" feature)
 * A user describes what they need in plain text and optionally sets a budget.
 * Admins review the request and attach ranked laptop recommendations.
 *
 * User   → create requests, view their own requests + recommendations
 * Admin  → view all requests, create recommendations, close requests
 */

import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { SystemRequestController } from "../controllers/system_request.controller";

const router = Router();

router.use(authenticate);

const SYSTEM_REQUEST_STATUSES = ["pending", "recommended", "purchased", "closed"] as const;

// ─── User ─────────────────────────────────────────────────────────────────────

/** Submit a new system request describing laptop needs + budget */
router.post(
  "/",
  [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters"),
    body("budgetMin")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum budget must be a non-negative number"),
    body("budgetMax")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum budget must be a non-negative number"),
    validate,
  ],
  SystemRequestController.create
);

/**
 * List system requests:
 * - User: sees only their own requests
 * - Admin: sees all requests
 */
router.get("/", SystemRequestController.list);

/** Get a single request with its recommendations */
router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Invalid request ID"), validate],
  SystemRequestController.getOne
);

/** Close a request (user no longer needs it) */
router.patch(
  "/:id/close",
  [param("id").isInt({ min: 1 }).withMessage("Invalid request ID"), validate],
  SystemRequestController.close
);

// ─── Admin only ───────────────────────────────────────────────────────────────

/** Add a ranked laptop recommendation to a request */
router.post(
  "/:id/recommendations",
  authorize("MANAGE_ORDERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid request ID"),
    body("configurationId")
      .isInt({ min: 1 })
      .withMessage("A valid laptop configuration must be selected"),
    body("rank")
      .isInt({ min: 1 })
      .withMessage("Rank must be a positive integer"),
    body("reason")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Reason must be under 1000 characters"),
    validate,
  ],
  SystemRequestController.addRecommendation
);

/** Remove a recommendation from a request */
router.delete(
  "/:id/recommendations/:recommendationId",
  authorize("MANAGE_ORDERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid request ID"),
    param("recommendationId")
      .isInt({ min: 1 })
      .withMessage("Invalid recommendation ID"),
    validate,
  ],
  SystemRequestController.removeRecommendation
);

/** Update request status (e.g. pending → recommended → purchased → closed) */
router.patch(
  "/:id/status",
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid request ID"),
    body("status")
      .isIn(SYSTEM_REQUEST_STATUSES)
      .withMessage(`Status must be one of: ${SYSTEM_REQUEST_STATUSES.join(", ")}`),
    validate,
  ],
  SystemRequestController.updateStatus
);

export default router;
