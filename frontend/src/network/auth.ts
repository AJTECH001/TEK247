import API, { BaseResponse } from "./API";
import { Endpoints, TOKEN_NAME, REFRESH_TOKEN_NAME, USER_PROFILE } from "./constant";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  status: "active" | "inactive" | "suspended";
  suiAddress: string | null;
  createdAt: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const logout = async (): Promise<BaseResponse<unknown>> => {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_NAME);
  return API.post<{ refreshToken: string | null }, unknown>(Endpoints.LOGOUT, {
    refreshToken,
  });
};

export const getMe = async (): Promise<BaseResponse<User>> => {
  return API.get<User>(Endpoints.GET_ME);
};

// ─── Enoki zkLogin ────────────────────────────────────────────────────────────

export const enokiLogin = async (body: {
  jwt: string;
  suiAddress: string;
}): Promise<BaseResponse<{ user: User; tokens: Tokens }>> => {
  return API.post<typeof body, { user: User; tokens: Tokens }>(Endpoints.ENOKI_LOGIN, body);
};

// ─── Session helpers ──────────────────────────────────────────────────────────

export const storeAuthData = (user: User, tokens: Tokens): void => {
  sessionStorage.setItem(TOKEN_NAME, tokens.accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_NAME, tokens.refreshToken);
  sessionStorage.setItem(USER_PROFILE, JSON.stringify(user));
};

export const clearAuthData = (): void => {
  sessionStorage.removeItem(TOKEN_NAME);
  sessionStorage.removeItem(REFRESH_TOKEN_NAME);
  sessionStorage.removeItem(USER_PROFILE);
};

export const getStoredUser = (): User | null => {
  const user = sessionStorage.getItem(USER_PROFILE);
  return user ? JSON.parse(user) : null;
};
