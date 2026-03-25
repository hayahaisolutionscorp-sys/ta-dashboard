import { bookingService } from "@/services/booking.service";
import { useQuery } from "@tanstack/react-query";

export function useBooking(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBookingById(bookingId),
    staleTime: 60 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
