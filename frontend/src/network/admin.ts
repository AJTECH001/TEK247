import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";
import type { User } from "./auth";

export const listUsers = async (
  page = 1,
  limit = 10
): Promise<BaseResponse<User[]>> => {
  return API.get<User[]>(`${Endpoints.ADMIN_USERS}?page=${page}&limit=${limit}`);
};

export const updateUserRole = async (
  id: number,
  role: "user" | "admin"
): Promise<BaseResponse<{ id: number; email: string; role: string }>> => {
  return API.patch<
    { role: string },
    { id: number; email: string; role: string }
  >(`${Endpoints.ADMIN_USERS}/${id}/role`, { role });
};
