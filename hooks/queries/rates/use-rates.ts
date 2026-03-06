import { useQuery } from "@tanstack/react-query";
import { ratesService } from "@/services/rates.service";

export function useRatesForRoute(routeCode: string | null | undefined) {
  console.log(
    `[useRatesForRoute] routeCode=${routeCode}, enabled=${!!routeCode}`,
  );
  return useQuery({
    queryKey: ["rates", routeCode],
    queryFn: async () => {
      console.log(
        `[useRatesForRoute] queryFn firing for routeCode=${routeCode}`,
      );
      const data = await ratesService.getRatesForRoute(routeCode!);
      console.log(`[useRatesForRoute] resolved data:`, data);
      return data;
    },
    enabled: !!routeCode,
  });
}
