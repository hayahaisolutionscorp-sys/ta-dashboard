import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getAuthToken, clearAuthCookies } from "@/lib/auth-cookies";

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AYAHAY_API_URL ?? "http://localhost:3002",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Try cookie first, then Zustand store
    const token = getAuthToken() ?? useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor for error handling + envelope unwrapping
api.interceptors.response.use(
  (response) => {
    // Auto-unwrap SuccessResponseInterceptor envelope: { status, message, data }
    const body = response.data;
    if (
      body &&
      typeof body === "object" &&
      "status" in body &&
      body.status === "success" &&
      "data" in body
    ) {
      response.data = body.data;
    }
    return response;
  },
  (error: AxiosError) => {
    // Only force-logout on 401s from auth endpoints, not from proxy/booking endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthEndpoint =
        url.includes("/travel-agencies-auth/") || url.includes("/auth/");
      if (isAuthEndpoint) {
        clearAuthCookies();
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.message ?? error.message ?? "An unexpected error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
