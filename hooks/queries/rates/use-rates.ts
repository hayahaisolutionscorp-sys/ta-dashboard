import { useQuery } from "@tanstack/react-query";
import { ratesService } from "@/services/rates.service";

export function useRatesForRoute(routeCode: string | null | undefined) {
  return useQuery({
    queryKey: ["rates", routeCode],
    queryFn: () => ratesService.getRatesForRoute(routeCode!),
    enabled: !!routeCode,
  });
}
