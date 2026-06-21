export const TOKEN_NAME = "TEK247_TOKEN" as const;
export const REFRESH_TOKEN_NAME = "TEK247_REFRESH_TOKEN" as const;
export const USER_PROFILE = "USER_PROFILE" as const;
export const API_URL = import.meta.env.VITE_API_BASE_URL;
export const PAGE_LIMIT = 10;

// ─── Auth Endpoints ────────────────────────────────────────────────────────────
const REGISTER            = "auth/register" as const;
const BALANCE             = "balance" as const;
const VERIFY_EMAIL        = "auth/verify-email" as const;
const RESEND_VERIFICATION = "auth/resend-verification" as const;
const LOGIN               = "auth/login" as const;
const LOGOUT              = "auth/logout" as const;
const REFRESH_TOKEN       = "auth/refresh" as const;
const FORGOT_PASSWORD     = "auth/forgot-password" as const;
const RESET_PASSWORD      = "auth/reset-password" as const;
const ENOKI_LOGIN         = "auth/enoki" as const;
const GET_ME              = "auth/me" as const;

// ─── Admin Endpoints ───────────────────────────────────────────────────────────
const ADMIN_USERS         = "admin/users" as const;

// ─── Laptop Endpoints ─────────────────────────────────────────────────────────
const LAPTOPS             = "laptops" as const;

// ─── System Request Endpoints ─────────────────────────────────────────────────
const SYSTEM_REQUESTS     = "system-requests" as const;

// ─── Orders & Payments ────────────────────────────────────────────────────────
const ORDERS              = "orders" as const;
const PAYMENTS            = "payments" as const;
const DELIVERIES          = "deliveries" as const;

// ─── Accessories ──────────────────────────────────────────────────────────────
const ACCESSORIES         = "accessories" as const;

// ─── Repairs ──────────────────────────────────────────────────────────────────
const REPAIR_SERVICES     = "repair-services" as const;
const REPAIRS             = "repairs" as const;
const REPAIR_PAYMENTS     = "repair-payments" as const;

// ─── Notifications ────────────────────────────────────────────────────────────
const NOTIFICATIONS       = "notifications" as const;

// ─── Query Keys ───────────────────────────────────────────────────────────────
const GET_ME_QUERY                    = "GET_ME_QUERY" as const;
const GET_ALL_USERS_QUERY             = "GET_ALL_USERS_QUERY" as const;
const GET_LAPTOPS_QUERY               = "GET_LAPTOPS_QUERY" as const;
const GET_SYSTEM_REQUESTS_QUERY       = "GET_SYSTEM_REQUESTS_QUERY" as const;
const GET_SYSTEM_REQUEST_DETAIL_QUERY = "GET_SYSTEM_REQUEST_DETAIL_QUERY" as const;
const GET_ORDERS_QUERY                = "GET_ORDERS_QUERY" as const;
const GET_ORDER_DETAIL_QUERY          = "GET_ORDER_DETAIL_QUERY" as const;
const GET_ACCESSORIES_QUERY           = "GET_ACCESSORIES_QUERY" as const;
const GET_REPAIRS_QUERY               = "GET_REPAIRS_QUERY" as const;
const GET_REPAIR_DETAIL_QUERY         = "GET_REPAIR_DETAIL_QUERY" as const;
const GET_REPAIR_SERVICES_QUERY       = "GET_REPAIR_SERVICES_QUERY" as const;
const GET_NOTIFICATIONS_QUERY         = "GET_NOTIFICATIONS_QUERY" as const;
const GET_UNREAD_COUNT_QUERY          = "GET_UNREAD_COUNT_QUERY" as const;
const GET_BALANCE_QUERY               = "GET_BALANCE_QUERY" as const;

export const Endpoints = {
  REGISTER,
  BALANCE,
  VERIFY_EMAIL,
  RESEND_VERIFICATION,
  LOGIN,
  LOGOUT,
  REFRESH_TOKEN,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  ENOKI_LOGIN,
  GET_ME,
  ADMIN_USERS,
  LAPTOPS,
  SYSTEM_REQUESTS,
  ORDERS,
  PAYMENTS,
  DELIVERIES,
  ACCESSORIES,
  REPAIR_SERVICES,
  REPAIRS,
  REPAIR_PAYMENTS,
  NOTIFICATIONS,
};

export const Query = {
  GET_ME_QUERY,
  GET_ALL_USERS_QUERY,
  GET_LAPTOPS_QUERY,
  GET_SYSTEM_REQUESTS_QUERY,
  GET_SYSTEM_REQUEST_DETAIL_QUERY,
  GET_ORDERS_QUERY,
  GET_ORDER_DETAIL_QUERY,
  GET_ACCESSORIES_QUERY,
  GET_REPAIRS_QUERY,
  GET_REPAIR_DETAIL_QUERY,
  GET_REPAIR_SERVICES_QUERY,
  GET_NOTIFICATIONS_QUERY,
  GET_UNREAD_COUNT_QUERY,
  GET_BALANCE_QUERY,
};
