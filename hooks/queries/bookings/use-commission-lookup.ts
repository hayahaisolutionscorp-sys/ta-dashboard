/**
 * useCommissionLookup — fetches the effective commission for a route.
 *
 * Calls GET /travel-agencies-booking/commission-lookup?routeId=
 * The api-v2 server resolves the agent's local_agency_id from the JWT and
 * applies agency-specific overrides automatically.
 *
 * Returns the commission amount (number) — 0 if none configured.
 * Used in TripSummaryPanel and PaymentMethodSection to show the TA the
 * discounted wallet deduction they will actually pay.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";

async function fetchCommissionLookup(routeId: number): Promise<number> {
  const res = await api.get<number>(
    `${TRAVEL_AGENCY_API.BOOKINGS.COMMISSION_LOOKUP}?routeId=${routeId}`,
  );
  return Number(res.data ?? 0);
}

export function useCommissionLookup(routeId: number | null | undefined) {
  return useQuery({
    queryKey: ["commission-lookup", routeId],
    queryFn: () => fetchCommissionLookup(routeId!),
    enabled: routeId != null && routeId > 0,
    staleTime: 60_000,
  });
}
