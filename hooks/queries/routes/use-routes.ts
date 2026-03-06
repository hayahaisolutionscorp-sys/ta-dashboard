import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";

export function useRoutesForAgency(agencyId: number | null | undefined) {
  return useQuery({
    queryKey: ["routes", agencyId],
    queryFn: () => bookingService.getRoutesForTa(agencyId!),
    enabled: agencyId != null && agencyId > 0,
  });
}
