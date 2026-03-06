import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type { RouteRates } from "@/constants/types/rate.types";

class RatesService {
  async getRatesForRoute(routeCode: string): Promise<RouteRates> {
    console.log(`[RatesService] fetching rates for route: ${routeCode}`);
    const response = await api.get<RouteRates>(
      TRAVEL_AGENCY_API.RATES.FOR_ROUTE(routeCode),
    );
    console.log(`[RatesService] raw response.data:`, response.data);
    // The axios interceptor in lib/api.ts already unwraps { message, data } → data
    return response.data;
  }
}

export const ratesService = new RatesService();
