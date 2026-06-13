import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { BalanceController } from "../controllers/balance.controller";

const router = Router();

router.use(authenticate);

router.get("/", BalanceController.getBalance);

export default router;
