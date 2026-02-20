import { bookingService } from "@/services/booking.service";
import type { FindBookingsQuery } from "@/lib/types/booking.types";
import { useQuery } from "@tanstack/react-query";

export function useBookings(params: FindBookingsQuery) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => bookingService.findBookings(params),
  });
}
