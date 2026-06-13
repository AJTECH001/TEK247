import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

export type SystemRequestStatus = "pending" | "recommended" | "purchased" | "closed";

export interface LaptopSpec {
  specOptionId: number;
  specName: string;
  categoryId: number;
  categoryName: string;
}

export interface RecommendedLaptop {
  id: number;
  name: string;
  shortSummary: string | null;
  basePrice: number;
  isActive: boolean;
  specs: LaptopSpec[];
}

export interface Recommendation {
  id: number;
  rank: number;
  reason: string | null;
  createdAt: string;
  laptop: RecommendedLaptop;
}

export interface SystemRequest {
  id: number;
  userId: number;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  status: SystemRequestStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; fullName: string; email: string };
}

export interface SystemRequestDetail extends SystemRequest {
  recommendations: Recommendation[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const listSystemRequests = (
  page = 1,
  limit = 10
): Promise<BaseResponse<SystemRequest[]>> =>
  API.get<SystemRequest[]>(
    `${Endpoints.SYSTEM_REQUESTS}?page=${page}&limit=${limit}`
  );

export const getSystemRequest = (
  id: number
): Promise<BaseResponse<SystemRequestDetail>> =>
  API.get<SystemRequestDetail>(`${Endpoints.SYSTEM_REQUESTS}/${id}`);

export const createSystemRequest = (payload: {
  description: string;
  budgetMin?: number;
  budgetMax?: number;
}): Promise<BaseResponse<SystemRequest>> =>
  API.post<typeof payload, SystemRequest>(Endpoints.SYSTEM_REQUESTS, payload);

export const closeSystemRequest = (
  id: number
): Promise<BaseResponse<SystemRequest>> =>
  API.patch<object, SystemRequest>(
    `${Endpoints.SYSTEM_REQUESTS}/${id}/close`,
    {}
  );

export const addRecommendation = (
  requestId: number,
  payload: { configurationId: number; rank: number; reason?: string }
): Promise<BaseResponse<unknown>> =>
  API.post<typeof payload, unknown>(
    `${Endpoints.SYSTEM_REQUESTS}/${requestId}/recommendations`,
    payload
  );

export const removeRecommendation = (
  requestId: number,
  recommendationId: number
): Promise<BaseResponse<unknown>> =>
  API.delete<unknown>(
    `${Endpoints.SYSTEM_REQUESTS}/${requestId}/recommendations/${recommendationId}`
  );

export const updateSystemRequestStatus = (
  id: number,
  status: SystemRequestStatus
): Promise<BaseResponse<SystemRequest>> =>
  API.patch<{ status: SystemRequestStatus }, SystemRequest>(
    `${Endpoints.SYSTEM_REQUESTS}/${id}/status`,
    { status }
  );
