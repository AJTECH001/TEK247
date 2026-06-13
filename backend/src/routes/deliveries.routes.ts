import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { DeliveryController } from "../controllers/delivery.controller";

const router = Router();

router.use(authenticate);

const DELIVERY_STATUSES = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
] as const;

const DELIVERY_METHODS = [
  "pickup",
  "courier",
  "dispatch_rider",
  "shipping_company",
] as const;

router.get(
  "/order/:orderId",
  [param("orderId").isInt({ min: 1 }).withMessage("Invalid order ID"), validate],
  DeliveryController.getByOrder
);

router.post(
  "/",
  authorize("admin"),
  [
    body("orderId")
      .isInt({ min: 1 })
      .withMessage("A valid order ID is required"),
    body("deliveryMethod")
      .isIn(DELIVERY_METHODS)
      .withMessage(`Method must be one of: ${DELIVERY_METHODS.join(", ")}`),
    body("recipientName")
      .trim()
      .notEmpty()
      .withMessage("Recipient name is required")
      .isLength({ max: 200 })
      .withMessage("Recipient name must be under 200 characters"),
    body("recipientPhone")
      .trim()
      .notEmpty()
      .withMessage("Recipient phone is required")
      .isLength({ max: 30 })
      .withMessage("Phone number must be under 30 characters"),
    body("deliveryAddress")
      .trim()
      .notEmpty()
      .withMessage("Delivery address is required")
      .isLength({ max: 500 })
      .withMessage("Delivery address must be under 500 characters"),
    body("deliveryNotes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be under 1000 characters"),
    validate,
  ],
  DeliveryController.create
);

router.get("/", authorize("admin"), DeliveryController.listAll);

router.get(
  "/:id",
  authorize("admin"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid delivery ID"), validate],
  DeliveryController.getOne
);

router.patch(
  "/:id/status",
  authorize("MANAGE_ORDERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid delivery ID"),
    body("status")
      .isIn(DELIVERY_STATUSES)
      .withMessage(`Status must be one of: ${DELIVERY_STATUSES.join(", ")}`),
    validate,
  ],
  DeliveryController.updateStatus
);

router.post(
  "/:id/updates",
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid delivery ID"),
    body("status")
      .isIn(DELIVERY_STATUSES)
      .withMessage(`Status must be one of: ${DELIVERY_STATUSES.join(", ")}`),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be under 1000 characters"),
    body("location")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Location must be under 200 characters"),
    validate,
  ],
  DeliveryController.addUpdate
);

router.patch(
  "/:id/assign",
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid delivery ID"),
    body("assignedTo")
      .isInt({ min: 1 })
      .withMessage("A valid rider ID is required"),
    validate,
  ],
  DeliveryController.assign
);

export default router;
