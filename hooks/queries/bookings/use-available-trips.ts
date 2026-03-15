/**
 * useAvailableTrips — queries available trips for a route, date, and
 * passenger/vehicle count.
 *
 * Used on the trip search screen (step 2 of the booking flow). The query
 * is disabled by default and must be explicitly enabled (e.g. on form
 * submit) to avoid fetching on every keystroke.
 *
 * - staleTime: 2 min — trip availability can change but is stable enough
 *   to avoid a re-fetch on every render during selection
 */
import { bookingService } from "@/services/booking.service";
import type { AvailableTripsQuery } from "@/constants/types/booking.types";
import { useQuery } from "@tanstack/react-query";

export function useAvailableTrips(
  query: AvailableTripsQuery | null,
  enabled = false,
) {
  return useQuery({
    queryKey: ["trips", "available", query],
    queryFn: () => bookingService.searchTrips(query!),
    enabled: enabled && !!query,
    staleTime: 2 * 60 * 1000,
  });
}
