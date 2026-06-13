import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { RepairController } from "../controllers/repair.controller";

const router = Router();

router.use(authenticate);

const REPAIR_STATUSES = [
  "pending",
  "diagnosed",
  "in_progress",
  "completed",
  "cancelled",
  "awaiting_parts",
] as const;

router.post(
  "/",
  [
    body("repairServiceId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Repair service ID must be a valid positive integer"),
    body("laptopBrand")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Brand must be under 100 characters"),
    body("laptopModel")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Model must be under 100 characters"),
    body("issueDescription")
      .trim()
      .notEmpty()
      .withMessage("Issue description is required")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Issue description must be between 10 and 2000 characters"),
    body("serialNumber")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Serial number must be under 100 characters"),
    validate,
  ],
  RepairController.create
);

router.get("/", RepairController.list);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Invalid repair ID"), validate],
  RepairController.getOne
);

router.patch(
  "/:id/diagnose",
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid repair ID"),
    body("repairServiceId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Repair service ID must be a valid positive integer"),
    body("estimatedCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Estimated cost must be a non-negative number"),
    validate,
  ],
  RepairController.diagnose
);

router.patch(
  "/:id/status",
  authorize("MANAGE_ORDERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid repair ID"),
    body("status")
      .isIn(REPAIR_STATUSES)
      .withMessage(`Status must be one of: ${REPAIR_STATUSES.join(", ")}`),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be under 1000 characters"),
    validate,
  ],
  RepairController.updateStatus
);

router.patch(
  "/:id/final-cost",
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid repair ID"),
    body("finalCost")
      .isFloat({ min: 0 })
      .withMessage("Final cost must be a non-negative number"),
    validate,
  ],
  RepairController.setFinalCost
);

router.patch(
  "/:id/assign",
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid repair ID"),
    body("technicianId")
      .isInt({ min: 1 })
      .withMessage("A valid technician ID is required"),
    validate,
  ],
  RepairController.assign
);

export default router;
