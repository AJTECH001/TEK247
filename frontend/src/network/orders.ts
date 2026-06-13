import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  configurationId: number;
  laptopName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderAccessory {
  id: number;
  accessoryId: number;
  accessoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  userId: number;
  systemRequestId: number | null;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; fullName: string; email: string };
  items?: OrderItem[];
  accessories?: OrderAccessory[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const listOrders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<BaseResponse<Order[]>> => {
  const query = new URLSearchParams();
  if (params?.page)   query.set("page",   String(params.page));
  if (params?.limit)  query.set("limit",  String(params.limit));
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return API.get<Order[]>(`${Endpoints.ORDERS}${qs ? `?${qs}` : ""}`);
};

export const getOrder = (id: number): Promise<BaseResponse<Order>> =>
  API.get<Order>(`${Endpoints.ORDERS}/${id}`);

export const createOrder = (data: {
  items: { configurationId: number; quantity: number }[];
  accessories?: { accessoryId: number; quantity: number }[];
  systemRequestId?: number;
}): Promise<BaseResponse<Order>> =>
  API.post<typeof data, Order>(Endpoints.ORDERS, data);

export const updateOrderStatus = (
  id: number,
  status: OrderStatus
): Promise<BaseResponse<Order>> =>
  API.patch<{ status: OrderStatus }, Order>(`${Endpoints.ORDERS}/${id}/status`, { status });

export const cancelOrder = (id: number): Promise<BaseResponse<Order>> =>
  API.patch<Record<string, never>, Order>(`${Endpoints.ORDERS}/${id}/cancel`, {});
