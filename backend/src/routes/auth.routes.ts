import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// POST /api/v1/auth/enoki — Enoki zkLogin (Google) session login
router.post(
  "/enoki",
  [
    body("jwt").notEmpty().withMessage("Google ID token is required"),
    body("suiAddress").notEmpty().withMessage("Sui address is required"),
    validate,
  ],
  AuthController.enokiLogin
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
    validate,
  ],
  AuthController.refresh
);

// POST /api/v1/auth/logout
router.post(
  "/logout",
  [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
    validate,
  ],
  AuthController.logout
);

// GET /api/v1/auth/me
router.get("/me", authenticate, AuthController.getMe);

export default router;
