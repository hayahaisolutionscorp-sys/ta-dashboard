import { bookingService } from "@/services/booking.service";
import { useQuery } from "@tanstack/react-query";

export function useBookingData(searchParams: URLSearchParams) {
  return useQuery({
    queryKey: ["booking", "prepare", searchParams.toString()],
    queryFn: () => bookingService.prepareBooking(searchParams),
    enabled: !!searchParams.toString(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
