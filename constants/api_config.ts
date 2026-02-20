export const AYAHAY_API = process.env.NEXT_PUBLIC_AYAHAY_API_URL;

export const API_TIMEOUT = 30_000;

export const TRAVEL_AGENCY_API = {
  AUTH: {
    LOGIN: "/travel-agencies-auth/login",
    LOGOUT: "/travel-agencies-auth/logout",
    REFRESH: "/travel-agencies-auth/refresh",
    FORGOT_PASSWORD: "/travel-agencies-auth/forgot-password",
    VERIFY_RESET_CODE: "/travel-agencies-auth/verify-reset-code",
    RESET_PASSWORD: "/travel-agencies-auth/reset-password",
    CHANGE_PASSWORD: "/travel-agencies-auth/change-password",
    VERIFY_EMAIL: "/travel-agencies-auth/verify-email",
    VERIFY_TOKEN: "/travel-agencies-auth/verify-token",
    PROFILE: "/travel-agencies-auth/me",
    UPDATE_PROFILE: "/travel-agencies-auth/me",
  },
  TA: {
    FIND: "/travel-agencies",
    UPDATE: (id: string) => `/travel-agencies/${id}`,
    DELETE: (id: string) => `/travel-agencies/${id}`,
    CREATE: "/travel-agencies",
  },
  TRIPS: {
    AVAILABLE: "/travel-agencies/available-trips",
  },
  BOOKINGS: {
    PREPARE: "/travel-agencies/bookings/prepare",
    CREATE: "/travel-agencies/bookings",
    FIND: "/travel-agencies/bookings",
    GET: (id: string) => `/travel-agencies/bookings/${id}`,
    PRICING: "/travel-agencies/bookings/pricing",
  },
  ROUTES: {
    BY_AGENT: (agentId: number) => `/travel-agencies/agents/${agentId}/tenants`,
  },
};
