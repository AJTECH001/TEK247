import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RepairStatus = "pending" | "diagnosed" | "in_progress" | "completed" | "cancelled" | "awaiting_parts";
export type RepairType = "screen" | "battery" | "keyboard" | "charging_port" | "motherboard" | "software" | "virus_removal" | "data_recovery" | "general_maintenance" | "other";

export interface RepairService {
  id: number;
  name: string;
  description: string | null;
  estimatedPrice: number;
  repairType: RepairType;
  estimatedDuration: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface RepairRequest {
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
  completedBy: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  user?: { id: number; fullName: string; email: string };
}

// ─── Repair Services API ──────────────────────────────────────────────────────

export const listRepairServices = (): Promise<BaseResponse<RepairService[]>> =>
  API.get<RepairService[]>(Endpoints.REPAIR_SERVICES);

export const createRepairService = (data: {
  name: string;
  description?: string;
  estimatedPrice: number;
  repairType: RepairType;
  estimatedDuration?: string;
}): Promise<BaseResponse<RepairService>> =>
  API.post<typeof data, RepairService>(Endpoints.REPAIR_SERVICES, data);

export const updateRepairService = (
  id: number,
  data: { name?: string; description?: string | null; estimatedPrice?: number; estimatedDuration?: string | null; isActive?: boolean }
): Promise<BaseResponse<RepairService>> =>
  API.patch<typeof data, RepairService>(`${Endpoints.REPAIR_SERVICES}/${id}`, data);

export const deactivateRepairService = (id: number): Promise<BaseResponse<RepairService>> =>
  API.delete<RepairService>(`${Endpoints.REPAIR_SERVICES}/${id}`);

// ─── Repair Requests API ──────────────────────────────────────────────────────

export const listRepairs = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<BaseResponse<RepairRequest[]>> => {
  const query = new URLSearchParams();
  if (params?.page)   query.set("page",   String(params.page));
  if (params?.limit)  query.set("limit",  String(params.limit));
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return API.get<RepairRequest[]>(`${Endpoints.REPAIRS}${qs ? `?${qs}` : ""}`);
};

export const getRepair = (id: number): Promise<BaseResponse<RepairRequest>> =>
  API.get<RepairRequest>(`${Endpoints.REPAIRS}/${id}`);

export const createRepair = (data: {
  issueDescription: string;
  laptopBrand?: string;
  laptopModel?: string;
  repairServiceId?: number;
}): Promise<BaseResponse<RepairRequest>> =>
  API.post<typeof data, RepairRequest>(Endpoints.REPAIRS, data);

export const diagnoseRepair = (
  id: number,
  data: { repairServiceId?: number; estimatedCost?: number }
): Promise<BaseResponse<RepairRequest>> =>
  API.patch<typeof data, RepairRequest>(`${Endpoints.REPAIRS}/${id}/diagnose`, data);

export const updateRepairStatus = (
  id: number,
  status: RepairStatus
): Promise<BaseResponse<RepairRequest>> =>
  API.patch<{ status: RepairStatus }, RepairRequest>(`${Endpoints.REPAIRS}/${id}/status`, { status });

export const setRepairFinalCost = (
  id: number,
  finalCost: number
): Promise<BaseResponse<RepairRequest>> =>
  API.patch<{ finalCost: number }, RepairRequest>(`${Endpoints.REPAIRS}/${id}/final-cost`, { finalCost });

export const assignRepairTechnician = (
  id: number,
  technicianId: number
): Promise<BaseResponse<RepairRequest>> =>
  API.patch<{ technicianId: number }, RepairRequest>(`${Endpoints.REPAIRS}/${id}/assign`, { technicianId });
