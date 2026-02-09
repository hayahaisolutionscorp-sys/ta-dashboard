import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore, type User } from "@/lib/stores/auth.store";
import {
  setAuthToken,
  setAuthUser,
  clearAuthCookies,
} from "@/lib/auth-cookies";
import {
  AYAHAY_API,
  API_TIMEOUT,
  TRAVEL_AGENCY_API,
} from "@/constants/api_config";
import type { LoginFormData } from "@/lib/validators/auth.validators";

// Create axios instance for TA auth
const taAuthApi = axios.create({
  baseURL: AYAHAY_API,
  timeout: API_TIMEOUT,
  withCredentials: true, // Important for cookies!
  headers: {
    "Content-Type": "application/json",
  },
});

// Backend wraps all responses in this envelope
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// API Response types (matching backend)
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    agency_name?: string;
    travel_agency_id?: number;
  };
}

interface ProfileResponse {
  email: string;
  display_name: string;
  agency_name?: string;
  travel_agency_id?: number;
}

// Auth API endpoints
const authApi = {
  login: async (data: LoginFormData): Promise<LoginResponse> => {
    const response = await taAuthApi.post<ApiResponse<LoginResponse>>(
      TRAVEL_AGENCY_API.AUTH.LOGIN,
      {
        email: data.email,
        password: data.password,
      },
    );
    return response.data.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await taAuthApi.post<ApiResponse<{ message: string }>>(
      TRAVEL_AGENCY_API.AUTH.LOGOUT,
    );
    return response.data.data;
  },

  getMe: async (): Promise<ProfileResponse> => {
    const response = await taAuthApi.get<ApiResponse<ProfileResponse>>(
      TRAVEL_AGENCY_API.AUTH.PROFILE,
    );
    return response.data.data;
  },

  verifyToken: async (): Promise<{ valid: boolean; user: ProfileResponse }> => {
    const response = await taAuthApi.get<
      ApiResponse<{ valid: boolean; user: ProfileResponse }>
    >(TRAVEL_AGENCY_API.AUTH.VERIFY_TOKEN);
    return response.data.data;
  },
};

// Helper to map backend user to store User type
function mapBackendUserToStoreUser(backendUser: LoginResponse["user"]): User {
  return {
    id: backendUser.id,
    travel_agent_name: backendUser.display_name,
    email: backendUser.email,
    contact_number:
      "contact_number" in backendUser &&
      typeof backendUser.contact_number === "string"
        ? backendUser.contact_number
        : "",
    address:
      "address" in backendUser && typeof backendUser.address === "string"
        ? backendUser.address
        : "",
    travel_agency_id: backendUser.travel_agency_id ?? null,
  };
}

// Error helper
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message ?? "An unexpected error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

// Login mutation hook
export function useLogin() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Add validation to ensure we have the required data
      if (!data || !data.user) {
        console.error("Login failed: Invalid response from server", data);
        throw new Error("Invalid login response from server");
      }

      const user = mapBackendUserToStoreUser(data.user);
      // Note: Cookies are set by the backend automatically (httpOnly)
      // We only store access_token in client state for axios headers
      setAuthToken(data.access_token);
      setAuthUser(user);
      // Update Zustand store
      login(user, data.access_token);
      queryClient.setQueryData(authKeys.me(), user);
    },
    onError: (error) => {
      console.error("Login failed:", getErrorMessage(error));
    },
  });
}

// Logout mutation hook
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear cookies
      clearAuthCookies();
      // Clear Zustand store
      logout();
      queryClient.clear();
    },
    onError: () => {
      // Logout locally even if API call fails
      clearAuthCookies();
      logout();
      queryClient.clear();
    },
  });
}
