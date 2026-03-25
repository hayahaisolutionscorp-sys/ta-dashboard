/**
 * useCreateBooking — mutation hook for the final booking submission.
 *
 * Wraps BookingService.createBooking() in a TanStack Query mutation.
 * On success, invalidates the ["bookings"] query cache so the bookings
 * list re-fetches automatically after the user is redirected.
 *
 * - retry: 1, retryDelay: 2 s — one automatic retry to handle brief
 *   network blips; the underlying service call uses a 60-second timeout
 *   to accommodate slow downstream processing in the client API.
 */
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { bookingService } from "@/services/booking.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingData: BookingFormData) =>
      bookingService.createBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    retry: 1,
    retryDelay: 2000,
  });
}
