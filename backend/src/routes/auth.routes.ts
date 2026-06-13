import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// POST /api/v1/auth/zklogin
router.post(
  "/zklogin",
  [
    body("jwt").notEmpty().withMessage("JWT is required"),
    body("sub").notEmpty().withMessage("Subject ID is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("suiAddress").notEmpty().withMessage("Sui address is required"),
    body("salt").notEmpty().withMessage("Salt is required"),
    validate,
  ],
  AuthController.zkLogin
);

// POST /api/v1/auth/zklogin-salt
router.post(
  "/zklogin-salt",
  [
    body("sub").notEmpty().withMessage("Subject ID is required"),
    validate,
  ],
  AuthController.getSalt
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
