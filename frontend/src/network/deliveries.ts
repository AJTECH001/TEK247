import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

export type DeliveryStatus =
  | "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";
export type DeliveryMethod = "pickup" | "courier" | "dispatch_rider" | "shipping_company";

export interface DeliveryUpdate {
  id: number;
  status: DeliveryStatus;
  location: string | null;
  notes: string | null;
  updatedBy: number | null;
  createdAt: string;
}

export interface Delivery {
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
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveredTo: string | null;
  deliveryNotes: string | null;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  updates?: DeliveryUpdate[];
}

const D = Endpoints.DELIVERIES;

export const listDeliveries = (params?: { page?: number; limit?: number; status?: string }): Promise<BaseResponse<Delivery[]>> => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return API.get<Delivery[]>(`${D}${qs ? `?${qs}` : ""}`);
};

export const getDelivery = (id: number): Promise<BaseResponse<Delivery>> =>
  API.get<Delivery>(`${D}/${id}`);

export const getDeliveryByOrder = (orderId: number): Promise<BaseResponse<Delivery>> =>
  API.get<Delivery>(`${D}/order/${orderId}`);

export const updateDeliveryStatus = (
  id: number,
  data: { status: DeliveryStatus; deliveredTo?: string }
): Promise<BaseResponse<Delivery>> =>
  API.patch<typeof data, Delivery>(`${D}/${id}/status`, data);

export const addDeliveryUpdate = (
  id: number,
  data: { status: DeliveryStatus; location?: string; notes?: string }
): Promise<BaseResponse<DeliveryUpdate>> =>
  API.post<typeof data, DeliveryUpdate>(`${D}/${id}/updates`, data);

export const assignDelivery = (id: number, assignedTo: number): Promise<BaseResponse<Delivery>> =>
  API.patch<{ assignedTo: number }, Delivery>(`${D}/${id}/assign`, { assignedTo });
