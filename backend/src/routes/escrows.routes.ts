import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorizeRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { EscrowController } from "../controllers/escrow.controller";

const router = Router();

router.use(authenticate);

// Record a freshly funded on-chain escrow (frontend posts the object id after exec).
router.post(
  "/index",
  [
    body("escrowObjectId").isString().trim().notEmpty().withMessage("escrowObjectId is required"),
    body("repairRequestId").optional().isInt({ min: 1 }),
    body("txDigest").optional().isString().trim(),
    validate,
  ],
  EscrowController.index
);

// Fresh authoritative on-chain read.
router.get(
  "/:objectId",
  [param("objectId").isString().trim().notEmpty(), validate],
  EscrowController.getOne
);

// Mirrored escrows for a repair request.
router.get(
  "/repair/:repairId",
  [param("repairId").isInt({ min: 1 }).withMessage("Invalid repair ID"), validate],
  EscrowController.listByRepair
);

// Admin/arbiter resolves a disputed escrow on-chain.
router.post(
  "/:objectId/resolve",
  authorizeRole("admin"),
  [
    param("objectId").isString().trim().notEmpty(),
    body("customerBps").isInt({ min: 0, max: 10000 }).withMessage("customerBps must be 0-10000"),
    validate,
  ],
  EscrowController.resolve
);

export default router;
