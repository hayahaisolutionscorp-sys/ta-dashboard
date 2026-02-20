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
  });
}
