import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
}

import { AUTH_COOKIE, TOKEN_STORAGE_KEY } from "@/lib/constants/auth";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthCookie(token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    clearAuthCookie();
  }
}

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" ? "/api" : "http://localhost:3000/api");

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FormData must not use application/json — axios would send { file: {} } and uploads fail
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";

    if (error.response?.status === 401 && typeof window !== "undefined") {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      code: error.response?.data?.code,
      errors: error.response?.data?.errors,
    });
  }
);

export async function apiRequest<T>(
  method: "get" | "post" | "patch" | "delete",
  url: string,
  data?: unknown,
  params?: Record<string, unknown>
): Promise<ApiSuccess<T>> {
  const response = await apiClient.request<ApiSuccess<T>>({
    method,
    url,
    data,
    params,
  });
  return response.data;
}
