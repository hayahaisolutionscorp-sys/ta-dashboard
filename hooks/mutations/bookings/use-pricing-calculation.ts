import { bookingService } from "@/services/booking.service";
import type {
  CalculatePricingRequest,
  CalculatePricingResponse,
} from "@/constants/types/booking.types";
import { useQuery } from "@tanstack/react-query";

interface UsePricingCalculationParams {
  request: CalculatePricingRequest | null;
  enabled?: boolean;
}

/**
 * usePricingCalculation — real-time pricing query for the booking form.
 *
 * Calls BookingService.calculatePricing() whenever the request changes
 * (passenger type, cabin selection, cargo class, etc.). The query key is
 * derived from the full JSON-serialized request so any field change triggers
 * a fresh fetch.
 *
 * Results include per-passenger/cargo base fares, applied charges, tax
 * totals, and a snapshotId. The snapshotId is stored in the form and sent
 * with createBooking() to lock rates at the time the user reviewed pricing.
 *
 * - staleTime: 30 s — avoids redundant calls while the user is editing
 * - retry: 1 — one automatic retry on transient network errors
 * - Only enabled when at least one passenger or cargo item is present
 */
export function usePricingCalculation({
  request,
  enabled = true,
}: UsePricingCalculationParams) {
  // Create a stable query key from the request
  const queryKey = [
    "booking",
    "pricing",
    request ? JSON.stringify(request) : null,
  ];

  return useQuery<CalculatePricingResponse>({
    queryKey,
    queryFn: async () => {
      if (!request) {
        throw new Error("No pricing request");
      }
      const result = await bookingService.calculatePricing(request);
      return result;
    },
    enabled:
      enabled &&
      !!request &&
      request.tripIds.length > 0 &&
      (request.passengers.length > 0 ||
        (request.cargos !== undefined && request.cargos.length > 0)),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
