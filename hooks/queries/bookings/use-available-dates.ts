import { bookingService } from "@/services/booking.service";
import { useQuery } from "@tanstack/react-query";

export function useAvailableDates(originCode: string, destinationCode: string) {
  return useQuery({
    queryKey: ["trips", "available-dates", originCode, destinationCode],
    queryFn: () =>
      bookingService.getAvailableDates(originCode, destinationCode),
    enabled: !!originCode && !!destinationCode,
    staleTime: 5 * 60 * 1000,
  });
}
