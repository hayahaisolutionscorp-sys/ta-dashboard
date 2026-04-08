import { bookingService } from "@/services/booking.service";
import { useQuery } from "@tanstack/react-query";

export function useBooking(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBookingById(bookingId),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
