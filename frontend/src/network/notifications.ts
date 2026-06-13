import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "repair_status" | "order_status" | "price_drop" | "system_recommendation" | "system";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  createdAt: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const listNotifications = (params?: {
  page?: number;
  limit?: number;
}): Promise<BaseResponse<Notification[]>> => {
  const query = new URLSearchParams();
  if (params?.page)  query.set("page",  String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return API.get<Notification[]>(`${Endpoints.NOTIFICATIONS}${qs ? `?${qs}` : ""}`);
};

export const getUnreadCount = (): Promise<BaseResponse<{ count: number }>> =>
  API.get<{ count: number }>(`${Endpoints.NOTIFICATIONS}/unread-count`);

export const markNotificationRead = (id: number): Promise<BaseResponse<void>> =>
  API.patch<Record<string, never>, void>(`${Endpoints.NOTIFICATIONS}/${id}/read`, {});

export const markAllNotificationsRead = (): Promise<BaseResponse<void>> =>
  API.patch<Record<string, never>, void>(`${Endpoints.NOTIFICATIONS}/read-all`, {});

export const sendNotification = (data: {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: number;
}): Promise<BaseResponse<Notification>> =>
  API.post<typeof data, Notification>(`${Endpoints.NOTIFICATIONS}/send`, data);
