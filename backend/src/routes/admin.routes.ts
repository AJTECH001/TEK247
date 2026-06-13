import { Router } from "express";
import { body, param } from "express-validator";
import { AdminController } from "../controllers/admin.controller";
import { AdminAnalyticsController } from "../controllers/admin_analytics.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// All admin routes require a valid token
router.use(authenticate);

// GET  /api/v1/admin/analytics/overview
router.get("/analytics/overview", authorize("VIEW_AUDIT_LOGS"), AdminAnalyticsController.getDashboardOverview);

// GET  /api/v1/admin/users
router.get("/users", authorize("MANAGE_USERS"), AdminController.listUsers);

// GET  /api/v1/admin/users/:id
router.get(
  "/users/:id",
  authorize("MANAGE_USERS"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid user ID"), validate],
  AdminController.getUser
);

// PATCH /api/v1/admin/users/:id/role
router.patch(
  "/users/:id/role",
  authorize("MANAGE_USERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid user ID"),
    body("role").isIn(["user", "admin"]).withMessage('Role must be "user" or "admin"'),
    validate,
  ],
  AdminController.updateRole
);

// PATCH /api/v1/admin/users/:id/status
router.patch(
  "/users/:id/status",
  authorize("MANAGE_USERS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid user ID"),
    body("status")
      .isIn(["active", "inactive", "suspended"])
      .withMessage('Status must be "active", "inactive", or "suspended"'),
    validate,
  ],
  AdminController.updateStatus
);

export default router;
