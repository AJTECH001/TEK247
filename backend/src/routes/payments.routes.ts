import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { PaymentController } from "../controllers/payment.controller";

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
  "usdc",
] as const;

router.post(
  "/",
  [
    body("orderId")
      .isInt({ min: 1 })
      .withMessage("A valid order ID is required"),
    body("amountPaid")
      .isFloat({ min: 0.01 })
      .withMessage("Payment amount must be greater than 0"),
    body("paymentMethod")
      .isIn(PAYMENT_METHODS)
      .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),
    body("transactionReference")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Reference must be under 200 characters"),
    body("paymentProofUrl")
      .optional()
      .isURL()
      .withMessage("Payment proof must be a valid URL")
      .isLength({ max: 2000 })
      .withMessage("URL must be under 2000 characters"),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be under 1000 characters"),
    validate,
  ],
  PaymentController.create
);

router.get(
  "/order/:orderId",
  [param("orderId").isInt({ min: 1 }).withMessage("Invalid order ID"), validate],
  PaymentController.listByOrder
);

router.get("/", authorize("MANAGE_PAYMENTS"), PaymentController.listAll);

router.patch(
  "/:id/verify",
  authorize("MANAGE_PAYMENTS"),
  [param("id").isInt({ min: 1 }).withMessage("Invalid payment ID"), validate],
  PaymentController.verify
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
  PaymentController.refund
);

export default router;
