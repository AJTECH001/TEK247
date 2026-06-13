import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { OrderController } from "../controllers/order.controller";

const router = Router();

router.use(authenticate);

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

router.post(
  "/",
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Order must contain at least one item"),
    body("items.*.configurationId")
      .isInt({ min: 1 })
      .withMessage("Each item must have a valid configurationId"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Each item quantity must be at least 1"),
    body("accessories")
      .optional()
      .isArray()
      .withMessage("Accessories must be an array"),
    body("accessories.*.accessoryId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Each accessory must have a valid accessoryId"),
    body("accessories.*.quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Each accessory quantity must be at least 1"),
    validate,
  ],
  OrderController.create
);

router.get("/", OrderController.list);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("Invalid order ID"), validate],
  OrderController.getOne
);

router.patch(
  "/:id/status",
  authorize("MANAGE_ORDERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid order ID"),
    body("status")
      .isIn(ORDER_STATUSES)
      .withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`),
    validate,
  ],
  OrderController.updateStatus
);

router.patch(
  "/:id/cancel",
  authorize("MANAGE_ORDERS"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid order ID"), validate],
  OrderController.cancel
);

export default router;
