import axios, { InternalAxiosRequestConfig } from "axios";
import { TOKEN_NAME, REFRESH_TOKEN_NAME, API_URL, Endpoints } from "./constant";

const instance = axios.create({ baseURL: API_URL });

// ─── Request interceptor: attach access token ─────────────────────────────────
instance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_NAME);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Refresh-token rotation queue ─────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

// ─── Response interceptor: 401 → refresh → retry ─────────────────────────────
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401 for protected endpoints.
    // Skip auth endpoints (login, register, forgot-password, etc.) — a 401
    // there means bad credentials, not an expired token.
    const isAuthEndpoint = originalRequest.url?.includes("/auth/");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(instance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_NAME);
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post<{
          data: { accessToken: string; refreshToken: string };
        }>(`${API_URL}/${Endpoints.REFRESH_TOKEN}`, { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        sessionStorage.setItem(TOKEN_NAME, accessToken);
        sessionStorage.setItem(REFRESH_TOKEN_NAME, newRefreshToken);

        instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear session and redirect to login
        sessionStorage.removeItem(TOKEN_NAME);
        sessionStorage.removeItem(REFRESH_TOKEN_NAME);
        sessionStorage.removeItem("USER_PROFILE");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize HTTP errors into our { error: string } shape
    if (error.response) {
      const msg: string =
        (error.response.data as { message?: string })?.message ?? "Something went wrong";
      return { data: { error: msg } };
    }
    return { data: { error: "Network error. Please try again." } };
  }
);

export default instance;
