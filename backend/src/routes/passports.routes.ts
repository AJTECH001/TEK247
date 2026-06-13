import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorizeRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { PassportController } from "../controllers/passport.controller";

const router = Router();

// Public verifiable read — anyone (e.g. a second-hand buyer) can inspect history.
router.get(
  "/:objectId",
  [param("objectId").isString().trim().notEmpty(), validate],
  PassportController.getOne
);

router.use(authenticate);

router.get(
  "/repair/:repairId",
  [param("repairId").isInt({ min: 1 }).withMessage("Invalid repair ID"), validate],
  PassportController.listByRepair
);

// Shop anchors a Walrus-backed repair record on-chain.
router.post(
  "/record",
  authorizeRole("admin"),
  [
    body("serialHash").isString().trim().notEmpty(),
    body("ownerAddress").isString().trim().notEmpty(),
    body("summary").isString().trim().isLength({ min: 1, max: 200 }),
    body("walrusBlobId").isString().trim().notEmpty(),
    body("contentHash").isString().trim().notEmpty(),
    body("brand").optional().isString().trim(),
    body("model").optional().isString().trim(),
    body("repairRequestId").optional().isInt({ min: 1 }),
    validate,
  ],
  PassportController.record
);

export default router;
