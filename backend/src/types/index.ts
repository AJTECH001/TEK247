export interface PaginationMeta {
  page: number;
  limit: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string>[];
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface JwtPayload {
  userId: number;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export interface UserRow {
  id: number;
  full_name: string;
  email: string;
  password_hash: string | null;
  role: "user" | "admin";
  is_email_verified: boolean;
  status: "active" | "inactive" | "suspended";
  sui_address: string | null;
  zklogin_salt: string | null;
  zklogin_sub: string | null;
  created_at: Date;
}

export interface RefreshTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface EmailVerificationTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface PasswordResetTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

// ─── Public-safe user shape (no password_hash) ────────────────────────────────

export interface SafeUser {
  id: number;
  fullName: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  status: "active" | "inactive" | "suspended";
  suiAddress: string | null;
  createdAt: Date;
}

// ─── System Request Types ─────────────────────────────────────────────────────

export type SystemRequestStatus = "pending" | "recommended" | "purchased" | "closed";

export interface SystemRequestRow {
  id: number;
  user_id: number;
  description: string;
  budget_min: string | null;
  budget_max: string | null;
  status: SystemRequestStatus;
  created_at: Date;
  updated_at: Date;
}

export interface SystemRequestRecommendationRow {
  id: number;
  system_request_id: number;
  configuration_id: number;
  rank: number;
  reason: string | null;
  created_at: Date;
}

// ─── Laptop Types ─────────────────────────────────────────────────────────────

export interface LaptopConfigRow {
  id: number;
  name: string;
  short_summary: string | null;
  base_price: string; // NUMERIC → pg returns as string
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AdminAuditLog {
  id: number;
  adminId: number | null;
  action: string;
  targetType: string;
  targetId: string | null;
  changes: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SpecCategoryRow {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SpecOptionRow {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Safe / Public Output Shapes ──────────────────────────────────────────────

export interface LaptopSpec {
  specOptionId: number;
  specName: string;
  categoryId: number;
  categoryName: string;
}

export interface SafeLaptop {
  id: number;
  name: string;
  shortSummary: string | null;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  specs?: LaptopSpec[];
}

export interface SafePriceHistoryEntry {
  id: number;
  oldPrice: number;
  newPrice: number;
  changedAt: Date;
  changedBy: number;
  changedByName: string;
}

export interface SafeRecommendation {
  id: number;
  rank: number;
  reason: string | null;
  createdAt: Date;
  laptop: SafeLaptop;
}

export interface SafeSystemRequest {
  id: number;
  userId: number;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  status: SystemRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; fullName: string; email: string };
  recommendations?: SafeRecommendation[];
}

// ─── Accessories ──────────────────────────────────────────────────────────────

export type AccessoryCategory = "bag" | "mouse" | "keyboard" | "charger" | "storage" | "hub" | "stand" | "other";

export interface AccessoryRow {
  id: number;
  name: string;
  category: AccessoryCategory;
  description: string | null;
  price: string;
  quantity_in_stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SafeAccessory {
  id: number;
  name: string;
  category: AccessoryCategory;
  description: string | null;
  price: number;
  quantityInStock: number;
  isActive: boolean;
  createdAt: Date;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryRow {
  id: number;
  configuration_id: number;
  quantity_in_stock: number;
  restock_threshold: number;
  updated_at: Date;
}

export interface SafeInventory {
  id: number;
  configurationId: number;
  laptopName?: string;
  quantityInStock: number;
  restockThreshold: number;
  updatedAt: Date;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderRow {
  id: number;
  user_id: number;
  system_request_id: number | null;
  status: OrderStatus;
  total_amount: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  configuration_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface OrderAccessoryRow {
  id: number;
  order_id: number;
  accessory_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface SafeOrderItem {
  id: number;
  configurationId: number;
  laptopName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SafeOrderAccessory {
  id: number;
  accessoryId: number;
  accessoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SafeOrder {
  id: number;
  userId: number;
  systemRequestId: number | null;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; fullName: string; email: string };
  items?: SafeOrderItem[];
  accessories?: SafeOrderAccessory[];
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "cash" | "transfer" | "card" | "pos" | "bank_deposit" | "ussd" | "installment" | "usdc";

export interface PaymentRow {
  id: number;
  order_id: number;
  amount_paid: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference: string | null;
  payment_proof_url: string | null;
  paid_at: Date;
  verified_by: number | null;
  verified_at: Date | null;
  notes: string | null;
}

export interface SafePayment {
  id: number;
  orderId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionReference: string | null;
  paymentProofUrl: string | null;
  paidAt: Date;
  verifiedBy: number | null;
  verifiedAt: Date | null;
  notes: string | null;
}

// ─── Deliveries ───────────────────────────────────────────────────────────────

export type DeliveryStatus = "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";
export type DeliveryMethod = "pickup" | "courier" | "dispatch_rider" | "shipping_company";

export interface DeliveryRow {
  id: number;
  order_id: number;
  delivery_method: DeliveryMethod;
  courier_name: string | null;
  tracking_number: string | null;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_state: string | null;
  delivery_lga: string | null;
  delivery_status: DeliveryStatus;
  estimated_delivery_date: Date | null;
  actual_delivery_date: Date | null;
  delivered_to: string | null;
  delivery_notes: string | null;
  assigned_to: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryUpdateRow {
  id: number;
  delivery_id: number;
  status: DeliveryStatus;
  location: string | null;
  notes: string | null;
  updated_by: number | null;
  created_at: Date;
}

export interface SafeDeliveryUpdate {
  id: number;
  status: DeliveryStatus;
  location: string | null;
  notes: string | null;
  updatedBy: number | null;
  createdAt: Date;
}

export interface SafeDelivery {
  id: number;
  orderId: number;
  deliveryMethod: DeliveryMethod;
  courierName: string | null;
  trackingNumber: string | null;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryState: string | null;
  deliveryLga: string | null;
  deliveryStatus: DeliveryStatus;
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  deliveredTo: string | null;
  deliveryNotes: string | null;
  assignedTo: number | null;
  createdAt: Date;
  updatedAt: Date;
  updates?: SafeDeliveryUpdate[];
}

// ─── Repair Services ──────────────────────────────────────────────────────────

export type RepairType = "screen" | "battery" | "keyboard" | "charging_port" | "motherboard" | "software" | "virus_removal" | "data_recovery" | "general_maintenance" | "other";

export interface RepairServiceRow {
  id: number;
  name: string;
  description: string | null;
  estimated_price: string;
  repair_type: RepairType;
  estimated_duration: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SafeRepairService {
  id: number;
  name: string;
  description: string | null;
  estimatedPrice: number;
  repairType: RepairType;
  estimatedDuration: string | null;
  isActive: boolean;
  createdAt: Date;
}

// ─── Repairs ──────────────────────────────────────────────────────────────────

export type RepairStatus = "pending" | "diagnosed" | "in_progress" | "completed" | "cancelled" | "awaiting_parts";

export interface RepairRequestRow {
  id: number;
  user_id: number;
  laptop_brand: string | null;
  laptop_model: string | null;
  issue_description: string;
  repair_service_id: number | null;
  status: RepairStatus;
  estimated_cost: string | null;
  final_cost: string | null;
  diagnosed_by: number | null;
  assigned_to: number | null;
  completed_by: number | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface SafeRepairRequest {
  id: number;
  userId: number;
  laptopBrand: string | null;
  laptopModel: string | null;
  issueDescription: string;
  repairServiceId: number | null;
  repairServiceName?: string | null;
  status: RepairStatus;
  estimatedCost: number | null;
  finalCost: number | null;
  diagnosedBy: number | null;
  assignedTo: number | null;
  completedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  user?: { id: number; fullName: string; email: string };
}

// ─── Repair Payments ──────────────────────────────────────────────────────────

export interface RepairPaymentRow {
  id: number;
  repair_request_id: number;
  amount_paid: string;
  payment_method: string | null;
  payment_status: "pending" | "completed" | "refunded";
  paid_at: Date;
}

export interface SafeRepairPayment {
  id: number;
  repairRequestId: number;
  amountPaid: number;
  paymentMethod: string | null;
  paymentStatus: "pending" | "completed" | "refunded";
  paidAt: Date;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = "repair_status" | "order_status" | "price_drop" | "system_recommendation" | "system";

export interface NotificationRow {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: boolean;
  created_at: Date;
}

export interface SafeNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  createdAt: Date;
}
