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
