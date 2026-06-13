import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessoryCategory = "bag" | "mouse" | "keyboard" | "charger" | "storage" | "hub" | "stand" | "other";

export interface Accessory {
  id: number;
  name: string;
  category: AccessoryCategory;
  description: string | null;
  price: number;
  quantityInStock: number;
  isActive: boolean;
  createdAt: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const listAccessories = (params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<BaseResponse<Accessory[]>> => {
  const query = new URLSearchParams();
  if (params?.page)     query.set("page",     String(params.page));
  if (params?.limit)    query.set("limit",    String(params.limit));
  if (params?.category) query.set("category", params.category);
  const qs = query.toString();
  return API.get<Accessory[]>(`${Endpoints.ACCESSORIES}${qs ? `?${qs}` : ""}`);
};

export const getAccessory = (id: number): Promise<BaseResponse<Accessory>> =>
  API.get<Accessory>(`${Endpoints.ACCESSORIES}/${id}`);

export const createAccessory = (data: {
  name: string;
  category: AccessoryCategory;
  description?: string;
  price: number;
  quantityInStock?: number;
}): Promise<BaseResponse<Accessory>> =>
  API.post<typeof data, Accessory>(Endpoints.ACCESSORIES, data);

export const updateAccessory = (
  id: number,
  data: { name?: string; description?: string | null; price?: number; isActive?: boolean }
): Promise<BaseResponse<Accessory>> =>
  API.patch<typeof data, Accessory>(`${Endpoints.ACCESSORIES}/${id}`, data);

export const updateAccessoryStock = (
  id: number,
  quantity: number
): Promise<BaseResponse<Accessory>> =>
  API.patch<{ quantity: number }, Accessory>(`${Endpoints.ACCESSORIES}/${id}/stock`, { quantity });

export const deactivateAccessory = (id: number): Promise<BaseResponse<Accessory>> =>
  API.delete<Accessory>(`${Endpoints.ACCESSORIES}/${id}`);
