export const AYAHAY_API = process.env.NEXT_PUBLIC_AYAHAY_API_URL;

export const API_TIMEOUT = 30_000;

export const ROUTES_API = {
  AVAILABLE: (ids: number[]) =>
    `/routes/tenants?${ids.map((id) => `ids=${id}`).join("&")}`,
};
export const TRIPS_API = {
  TRIP: "/public/trips",
  AVAILABLE: "/public/trips/available-dates",
};
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
  BOOKINGS: {
    PREPARE: "/travel-agencies-booking/prepare",
    CREATE: "/travel-agencies-booking",
    FIND: "/travel-agencies-booking",
    GET: (id: string) => `/travel-agencies-booking/${id}`,
    PRICING: "/travel-agencies-booking/pricing",
  },
  ROUTES: {
    BY_AGENCY: (agencyId: number) =>
      `/travel-agencies-routes/agency/${agencyId}/routes`,
  },
  TENANTS: {
    FULL_INFO: (agencyId: number) =>
      `/travel-agencies-tenants/agency/${agencyId}/tenants`,
    IDS: (agencyId: number) =>
      `/travel-agencies-tenants/agency/${agencyId}/tenantId`,
  },
};
