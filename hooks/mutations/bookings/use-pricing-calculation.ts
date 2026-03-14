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
 * Hook that calls the pricing API to get real-time pricing estimates.
 * Uses react-query with a stable key derived from the request body.
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
      console.log(
        "[usePricingCalculation] Calling pricing API:",
        JSON.stringify(request, null, 2),
      );
      const result = await bookingService.calculatePricing(request);
      console.log(
        "[usePricingCalculation] Pricing API response:",
        JSON.stringify(result, null, 2),
      );
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
