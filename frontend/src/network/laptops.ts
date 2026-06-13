import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";
import type { LaptopSpec } from "./system-requests";

export interface Laptop {
  id: number;
  name: string;
  shortSummary: string | null;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  specs?: LaptopSpec[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const listLaptops = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  includeInactive?: boolean;
}): Promise<BaseResponse<Laptop[]>> => {
  const query = new URLSearchParams();
  if (params?.page)           query.set("page",           String(params.page));
  if (params?.limit)          query.set("limit",          String(params.limit));
  if (params?.search)         query.set("search",         params.search);
  if (params?.minPrice)       query.set("minPrice",       String(params.minPrice));
  if (params?.maxPrice)       query.set("maxPrice",       String(params.maxPrice));
  if (params?.includeInactive) query.set("includeInactive", "true");
  const qs = query.toString();
  return API.get<Laptop[]>(`${Endpoints.LAPTOPS}${qs ? `?${qs}` : ""}`);
};

export const getLaptop = (id: number): Promise<BaseResponse<Laptop>> =>
  API.get<Laptop>(`${Endpoints.LAPTOPS}/${id}`);
