import { bookingService } from "@/services/booking.service";
import { useQuery } from "@tanstack/react-query";

export function useFindLocalId(userId: string, agencyId: number) {
  return useQuery({
    queryKey: ["booking", "localId", userId, agencyId],
    queryFn: () => bookingService.GetMyLocalId(userId, agencyId),
    enabled: !!userId && !!agencyId,
    staleTime: 2 * 60 * 1000,
  });
}
