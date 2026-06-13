import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { NotificationController } from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

const NOTIFICATION_TYPES = [
  "repair_status",
  "order_status",
  "price_drop",
  "system_recommendation",
  "system",
] as const;

// NOTE: specific paths must come before /:id/read to avoid route collisions
router.get("/unread-count", NotificationController.unreadCount);
router.patch("/read-all", NotificationController.markAllRead);
router.get("/", NotificationController.list);

router.patch(
  "/:id/read",
  [param("id").isInt({ min: 1 }).withMessage("Invalid notification ID"), validate],
  NotificationController.markRead
);

router.post(
  "/send",
  authorize("admin"),
  [
    body("userId")
      .isInt({ min: 1 })
      .withMessage("A valid user ID is required"),
    body("type")
      .isIn(NOTIFICATION_TYPES)
      .withMessage(`Type must be one of: ${NOTIFICATION_TYPES.join(", ")}`),
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 200 })
      .withMessage("Title must be under 200 characters"),
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 2000 })
      .withMessage("Message must be under 2000 characters"),
    validate,
  ],
  NotificationController.send
);

export default router;
