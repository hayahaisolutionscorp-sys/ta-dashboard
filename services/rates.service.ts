/**
 * RatesService — fetches charge-rule rate tables for a given route.
 *
 * Rates are used by TripSummaryPanel to display the fee schedule
 * (passenger charges, vehicle fees, cargo fees) before the user
 * submits a booking. The actual binding pricing calculation is done
 * server-side via BookingService.calculatePricing().
 */
import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type { RouteRates } from "@/constants/types/rate.types";

class RatesService {
  /**
   * Fetch all charge rules (rates) configured for a route.
   * Returns fare tables, surcharges, and taxes grouped by service domain
   * (PASSENGER / VEHICLE / CARGO). The axios interceptor unwraps the
   * { message, data } envelope automatically.
   */
  async getRatesForRoute(routeCode: string): Promise<RouteRates> {
    const response = await api.get<RouteRates>(
      TRAVEL_AGENCY_API.RATES.FOR_ROUTE(routeCode),
    );
    // The axios interceptor in lib/api.ts already unwraps { message, data } → data
    return response.data;
  }
}

export const ratesService = new RatesService();
