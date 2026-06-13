import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import balanceRoutes from "./balance.routes";
import laptopRoutes from "./laptops.routes";
import specCategoryRoutes from "./spec_categories.routes";
import specOptionRoutes from "./spec_options.routes";
import inventoryRoutes from "./inventory.routes";
import accessoryRoutes from "./accessories.routes";
import systemRequestRoutes from "./system_requests.routes";
import orderRoutes from "./orders.routes";
import paymentRoutes from "./payments.routes";
import deliveryRoutes from "./deliveries.routes";
import repairServiceRoutes from "./repair_services.routes";
import repairRoutes from "./repairs.routes";
import repairPaymentRoutes from "./repair_payments.routes";
import escrowRoutes from "./escrows.routes";
import passportRoutes from "./passports.routes";
import notificationRoutes from "./notifications.routes";

const router = Router();

// ─── Auth & Users ──────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/balance", balanceRoutes);

// ─── Showroom ─────────────────────────────────────────────────────────────────
router.use("/laptops", laptopRoutes);
router.use("/spec-categories", specCategoryRoutes);
router.use("/spec-options", specOptionRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/accessories", accessoryRoutes);

// ─── Personal Shopper ─────────────────────────────────────────────────────────
router.use("/system-requests", systemRequestRoutes);

// ─── Sales & Checkout ─────────────────────────────────────────────────────────
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);

// ─── Delivery ─────────────────────────────────────────────────────────────────
router.use("/deliveries", deliveryRoutes);

// ─── Repair Workshop ──────────────────────────────────────────────────────────
router.use("/repair-services", repairServiceRoutes);
router.use("/repairs", repairRoutes);
router.use("/repair-payments", repairPaymentRoutes);

// ─── On-chain Escrow (Sui) ────────────────────────────────────────────────────
router.use("/escrows", escrowRoutes);

// ─── Device Passport (Sui + Walrus) ───────────────────────────────────────────
router.use("/passports", passportRoutes);

// ─── Notifications ────────────────────────────────────────────────────────────
router.use("/notifications", notificationRoutes);

export default router;
