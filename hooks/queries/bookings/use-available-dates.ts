/**
 * useAvailableDates — fetches dates that have at least one available trip
 * for an origin → destination pair.
 *
 * Powers the date picker on the trip search screen so the user can only
 * select valid departure dates. Re-fetches on mount or window focus if
 * the cached result is empty, to handle the case where no trips existed
 * initially but new schedules have since been added.
 *
 * - staleTime: 5 min
 * - retry: 2 with exponential back-off (max 8 s)
 */
import { bookingService } from "@/services/booking.service";
import { useQuery } from "@tanstack/react-query";

export function useAvailableDates(originCode: string, destinationCode: string) {
  return useQuery({
    queryKey: ["trips", "available-dates", originCode, destinationCode],
    queryFn: () =>
      bookingService.getAvailableDates(originCode, destinationCode),
    enabled: !!originCode && !!destinationCode,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    // Re-fetch on mount/focus if the cached data is empty or missing
    refetchOnMount: (query) => {
      const data = query.state.data;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return true;
      }
      return false;
    },
    refetchOnWindowFocus: (query) => {
      const data = query.state.data;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return true;
      }
      return false;
    },
  });
}
