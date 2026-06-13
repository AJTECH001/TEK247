import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { RepairServiceController } from "../controllers/repair_service.controller";

const router = Router();

const REPAIR_TYPES = [
  "screen",
  "battery",
  "keyboard",
  "charging_port",
  "motherboard",
  "software",
  "virus_removal",
  "data_recovery",
  "general_maintenance",
  "other",
] as const;

router.get("/", RepairServiceController.list);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Invalid repair service ID"), validate],
  RepairServiceController.getOne
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Service name is required")
      .isLength({ max: 200 })
      .withMessage("Name must be under 200 characters"),
    body("repairType")
      .isIn(REPAIR_TYPES)
      .withMessage(`Repair type must be one of: ${REPAIR_TYPES.join(", ")}`),
    body("estimatedPrice")
      .isFloat({ min: 0 })
      .withMessage("Estimated price must be a non-negative number"),
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be under 1000 characters"),
    validate,
  ],
  RepairServiceController.create
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid repair service ID"),
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ max: 200 })
      .withMessage("Name must be under 200 characters"),
    body("repairType")
      .optional()
      .isIn(REPAIR_TYPES)
      .withMessage(`Repair type must be one of: ${REPAIR_TYPES.join(", ")}`),
    body("estimatedPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Estimated price must be a non-negative number"),
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be under 1000 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    validate,
  ],
  RepairServiceController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid repair service ID"), validate],
  RepairServiceController.deactivate
);

export default router;
