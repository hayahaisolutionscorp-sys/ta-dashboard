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
    BULK_INVALIDATE: (id: string) =>
      `/travel-agencies-booking/${id}/bulk-invalidate`,
    BULK_REFUND: (id: string) => `/travel-agencies-booking/${id}/bulk-refund`,
    BULK_REBOOK: (id: string) => `/travel-agencies-booking/${id}/bulk-rebook`,
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
  LOCAL: {
    GET: (userId: string, agency_id: number) =>
      `/travel-agencies-booking/${userId}/agencyId/${agency_id}/local-id`,
  },
  RATES: {
    FOR_ROUTE: (routeCode: string) => `/rates/route/${routeCode}`,
  },
  MARKUP: {
    CREATE: "/travel-agency-markup",
    AGENCY_AGENTS: "/travel-agency-markup/agency-agents",
    BY_AGENT: (agentId: string) => `/travel-agency-markup/agent/${agentId}`,
    BY_ROUTE: (routeId: number) => `/travel-agency-markup/route/${routeId}`,
    BY_AGENT_AND_ROUTE: (agentId: string, routeId: number) =>
      `/travel-agency-markup/agent/${agentId}/route/${routeId}`,
    UPDATE: (agentId: string, routeId: number) =>
      `/travel-agency-markup/agent/${agentId}/route/${routeId}`,
  },
  STAFF: {
    REGISTER: "/travel-agency-markup/register-staff",
    LIST_ALL: "/travel-agency-markup/agency-staff",
  },
  WALLET: {
    BY_AGENCY: "/travel-agency-wallet/agency",
    BY_AGENT: (agentId: string) => `/travel-agency-wallet/agent/${agentId}`,
    SPLIT_STATUS: (splitTransactionId: string) =>
      `/travel-agency-wallet/split-deposit/${splitTransactionId}`,
    DEPOSIT: "/travel-agency-wallet/deposit",
    WITHDRAWAL_REQUEST: "/travel-agency-wallet/withdrawal-request",
    MANUAL_DEPOSIT: "/travel-agency-wallet/manual-deposit",
  },
  MEDIA: {
    UPLOAD_VERIFICATION: "/upload/verification-document",
  },
  PAYMENTS: {
    CHECKOUT_SESSION: "/v2/payments/paymongo/checkout-session",
    PAYMONGO_INITIATE: "/v2/payments/paymongo/initiate",
    SPLIT_DEPOSIT: "/v2/payments/paymongo/split-deposit",
    MAYA_SPLIT_DEPOSIT: "/v2/payments/maya/split-deposit",
    MAYA_CHECKOUT: "/v2/payments/maya/checkout",
  },
  PAYMENT_PROVIDERS: {
    ENABLED: "/payments/providers/enabled",
    DEPOSIT_METHODS: "/payments/providers/deposit-methods",
  },
  REPORTS: {
    AGENCY_PERFORMANCE: "/travel-agency-reports/agency-performance",
    STAFF_PERFORMANCE: "/travel-agency-reports/staff-performance",
    AGENCY_PERFORMANCE_DATA: "/travel-agency-reports/agency-performance/data",
    STAFF_PERFORMANCE_DATA: "/travel-agency-reports/staff-performance/data",
  },
};
