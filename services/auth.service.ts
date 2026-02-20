import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore, type User } from "@/lib/stores/auth.store";
import {
  setAuthToken,
  setAuthUser,
  clearAuthCookies,
  getAuthToken,
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
  withCredentials: true, // Sends httpOnly cookies (access_token set by server)
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject stored Bearer token on every request so both auth paths work
taAuthApi.interceptors.request.use((config) => {
  const token = getAuthToken() ?? useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-unwrap SuccessResponseInterceptor envelope: { status, message, data }
taAuthApi.interceptors.response.use((response) => {
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
});

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
    const response = await taAuthApi.post<LoginResponse>(
      TRAVEL_AGENCY_API.AUTH.LOGIN,
      {
        email: data.email,
        password: data.password,
      },
    );
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await taAuthApi.post<{ message: string }>(
      TRAVEL_AGENCY_API.AUTH.LOGOUT,
    );
    return response.data;
  },

  getMe: async (): Promise<ProfileResponse> => {
    const response = await taAuthApi.get<ProfileResponse>(
      TRAVEL_AGENCY_API.AUTH.PROFILE,
    );
    return response.data;
  },

  verifyToken: async (): Promise<{ valid: boolean; user: ProfileResponse }> => {
    const response = await taAuthApi.get<{
      valid: boolean;
      user: ProfileResponse;
    }>(TRAVEL_AGENCY_API.AUTH.VERIFY_TOKEN);
    return response.data;
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
      if (!data?.user || !data?.access_token) {
        return; // Let the form handle missing data gracefully
      }

      const user = mapBackendUserToStoreUser(data.user);
      setAuthToken(data.access_token);
      setAuthUser(user);
      login(user, data.access_token);
      queryClient.setQueryData(authKeys.me(), user);
    },
    onError: () => {
      // Error is displayed in the form via loginMutation.error
    },
  });
}

// Logout mutation hook
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  const clearAndRedirect = () => {
    clearAuthCookies();
    logout();
    queryClient.clear();
    window.location.href = "/login";
  };

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: clearAndRedirect,
    onError: clearAndRedirect, // Logout locally even if API call fails
  });
}
