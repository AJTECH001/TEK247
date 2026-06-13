import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { RepairPaymentController } from "../controllers/repair_payment.controller";

const router = Router();

router.use(authenticate);

const PAYMENT_METHODS = [
  "cash",
  "transfer",
  "card",
  "pos",
  "bank_deposit",
  "ussd",
  "installment",
] as const;

router.post(
  "/",
  [
    body("repairRequestId")
      .isInt({ min: 1 })
      .withMessage("A valid repair request ID is required"),
    body("amountPaid")
      .isFloat({ min: 0.01 })
      .withMessage("Payment amount must be greater than 0"),
    body("paymentMethod")
      .isIn(PAYMENT_METHODS)
      .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),
    body("reference")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Reference must be under 200 characters"),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be under 1000 characters"),
    validate,
  ],
  RepairPaymentController.create
);

router.get(
  "/repair/:repairId",
  [param("repairId").isInt({ min: 1 }).withMessage("Invalid repair ID"), validate],
  RepairPaymentController.listByRepair
);

router.get("/", authorize("MANAGE_PAYMENTS"), RepairPaymentController.listAll);

router.patch(
  "/:id/complete",
  authorize("MANAGE_PAYMENTS"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid payment ID"), validate],
  RepairPaymentController.complete
);

router.patch(
  "/:id/refund",
  authorize("MANAGE_PAYMENTS"),
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid payment ID"),
    body("reason")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Refund reason must be under 500 characters"),
    validate,
  ],
  RepairPaymentController.refund
);

export default router;
