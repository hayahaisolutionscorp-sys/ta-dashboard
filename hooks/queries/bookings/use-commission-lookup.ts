/**
 * useCommissionLookup — fetches the effective CommissionConfig for a route.
 *
 * Calls GET /travel-agencies-booking/commission-lookup?routeId=
 * The api-v2 server resolves the agent's local_agency_id from the JWT and
 * applies agency-specific overrides automatically.
 *
 * Returns a CommissionConfig with passenger and cargo commission type + value.
 * Use calculateCommissionAmounts() from lib/utils/commission.ts to compute
 * the actual PHP amounts once fare totals are known.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import {
  type CommissionConfig,
  ZERO_COMMISSION_CONFIG,
} from "@/constants/types/booking.types";

async function fetchCommissionLookup(routeId: number): Promise<CommissionConfig> {
  const res = await api.get<CommissionConfig>(
    `${TRAVEL_AGENCY_API.BOOKINGS.COMMISSION_LOOKUP}?routeId=${routeId}`,
  );
  return res.data ?? ZERO_COMMISSION_CONFIG;
}

export function useCommissionLookup(routeId: number | null | undefined) {
  return useQuery({
    queryKey: ["commission-lookup", routeId],
    queryFn: () => fetchCommissionLookup(routeId!),
    enabled: routeId != null && routeId > 0,
    staleTime: 60_000,
  });
}
