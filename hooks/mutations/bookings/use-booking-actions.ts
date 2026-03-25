import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";
import type {
  BulkInvalidateRequest,
  BulkRefundRequest,
  BulkRebookRequest,
} from "@/constants/types/booking.types";

export function useBulkInvalidate(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkInvalidateRequest) =>
      bookingService.bulkInvalidate(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useBulkRefund(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRefundRequest) =>
      bookingService.bulkRefund(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useBulkRebook(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRebookRequest) =>
      bookingService.bulkRebook(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
