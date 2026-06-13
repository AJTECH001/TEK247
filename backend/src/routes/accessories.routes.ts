import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { AccessoryController } from "../controllers/accessory.controller";

const router = Router();

const ACCESSORY_CATEGORIES = [
  "bag",
  "mouse",
  "keyboard",
  "charger",
  "storage",
  "hub",
  "stand",
  "other",
] as const;

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/", AccessoryController.list);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Invalid accessory ID"), validate],
  AccessoryController.getOne
);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("MANAGE_SYSTEM"),
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Accessory name is required")
      .isLength({ max: 200 })
      .withMessage("Name must be under 200 characters"),
    body("category")
      .isIn(ACCESSORY_CATEGORIES)
      .withMessage(`Category must be one of: ${ACCESSORY_CATEGORIES.join(", ")}`),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be under 1000 characters"),
    body("stockQuantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stock quantity must be a non-negative integer"),
    validate,
  ],
  AccessoryController.create
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid accessory ID"),
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ max: 200 })
      .withMessage("Name must be under 200 characters"),
    body("category")
      .optional()
      .isIn(ACCESSORY_CATEGORIES)
      .withMessage(`Category must be one of: ${ACCESSORY_CATEGORIES.join(", ")}`),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
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
  AccessoryController.update
);

router.patch(
  "/:id/stock",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid accessory ID"),
    body("quantity")
      .isInt()
      .withMessage("Quantity must be an integer"),
    validate,
  ],
  AccessoryController.updateStock
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid accessory ID"), validate],
  AccessoryController.deactivate
);

export default router;
