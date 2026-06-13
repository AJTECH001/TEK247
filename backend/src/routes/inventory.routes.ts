import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { InventoryController } from "../controllers/inventory.controller";

const router = Router();

router.use(authenticate, authorize("MANAGE_SYSTEM"));

router.get("/", InventoryController.list);

router.get(
  "/:configurationId",
  [
    param("configurationId")
      .isInt({ min: 1 })
      .withMessage("Invalid configuration ID"),
    validate,
  ],
  InventoryController.getOne
);

router.patch(
  "/:configurationId",
  [
    param("configurationId")
      .isInt({ min: 1 })
      .withMessage("Invalid configuration ID"),
    body("quantityInStock")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    validate,
  ],
  InventoryController.update
);

export default router;
