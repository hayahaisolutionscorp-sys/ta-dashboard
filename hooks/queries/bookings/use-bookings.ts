import { bookingService } from "@/services/booking.service";
import type { FindBookingsQuery } from "@/constants/types/booking.types";
import { useQuery } from "@tanstack/react-query";

export function useBookings(params: FindBookingsQuery) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => bookingService.findBookingsByAgent(params),
    enabled: !!params.userId && params.agencyId != null && params.agencyId > 0,
  });
}
