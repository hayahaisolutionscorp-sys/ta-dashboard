/**
 * useBookingData — fetches prepared booking data for the create booking form.
 *
 * Calls BookingService.prepareBooking() with the current URL search params
 * (which carry the selected trip IDs). The response contains trip details,
 * available cabin types, discount/passenger types, vehicle classes, cargo
 * classes, and accommodation codes needed to render all form sections.
 *
 * - staleTime: 5 min — trip metadata rarely changes mid-session
 * - refetchOnMount/WindowFocus: false — prevents re-fetches that would
 *   reset form-derived state while the user is filling out the form
 */
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
