/**
 * useRoutesForAgency — fetches the port-pair routes available to a travel agency.
 *
 * Used in two places:
 *  1. Trip search screen — populates the origin/destination dropdowns.
 *  2. Create booking page — looks up the agent's configured markup for the
 *     selected route so it can be pre-filled in the booking form.
 *
 * Only runs when a valid agencyId (> 0) is available.
 */
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";

export function useRoutesForAgency(agencyId: number | null | undefined) {
  return useQuery({
    queryKey: ["routes", agencyId],
    queryFn: () => bookingService.getRoutesForTa(agencyId!),
    enabled: agencyId != null && agencyId > 0,
  });
}
