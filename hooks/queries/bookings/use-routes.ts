import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";
import { useAuthStore } from "@/lib/stores/auth.store";

export function useRoutes() {
  const user = useAuthStore((s) => s.user);
  const travelAgencyId = user?.travel_agency_id;

  return useQuery({
    queryKey: ["routes", "travel-agency", travelAgencyId],
    queryFn: () => {
      if (!travelAgencyId) {
        throw new Error("No travel agency associated with this account");
      }
      return bookingService.getRoutesForTa(travelAgencyId);
    },
    enabled: !!travelAgencyId,
    staleTime: 5 * 60 * 1000,
  });
}
