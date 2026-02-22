import { api } from "@/lib/api";
import {
  TRAVEL_AGENCY_API,
  ROUTES_API,
  TRIPS_API,
} from "@/constants/api_config";
import type {
  SuccessResponse,
  PreparedBookingData,
  BookingView,
  PageResult,
  FindBookingsQuery,
  AvailableTripsQuery,
  AvailableTripsResult,
  AvailableDateItem,
  TripView,
  CalculatePricingRequest,
  CalculatePricingResponse,
} from "@/lib/types/booking.types";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { RouteEntity, TravelAgencyTenantWithNameEntity } from "@/constants";

class BookingService {
  /**
   * Search for available trips across tenants
   */
  async searchTrips(query: AvailableTripsQuery): Promise<AvailableTripsResult> {
    const params = new URLSearchParams();
    params.set("origin_code", query.origin_code);
    params.set("destination_code", query.destination_code);
    params.set("departure_date", query.departure_date);
    params.set("passenger_count", String(query.passenger_count ?? 1));
    params.set("vehicle_count", String(query.vehicle_count ?? 0));
    params.set("page", String(query.page ?? 1));
    params.set("sort", query.sort ?? "departureDate");

    const response = await api.get<{ message: string; data: TripView[] }[]>(
      `${TRIPS_API.TRIP}?${params.toString()}`,
    );
    console.log("[searchTrips] Response:", response);

    // response.data is an array of per-tenant results: [{ message, data: [...trips] }]
    const tenantResults = response.data;
    const allTrips = tenantResults.flatMap((r) =>
      Array.isArray(r?.data) ? r.data : [],
    );
    return { total: allTrips.length, data: allTrips };
  }

  /**
   * Get dates that have available trips for a route
   */
  async getAvailableDates(
    originCode: string,
    destinationCode: string,
    limit = 30,
  ): Promise<AvailableDateItem[]> {
    const params = new URLSearchParams();
    params.set("origin_code", originCode);
    params.set("destination_code", destinationCode);
    params.set("limit", String(limit));

    const response = await api.get<AvailableDateItem[]>(
      `${TRIPS_API.AVAILABLE}?${params.toString()}`,
    );
    return response.data;
  }

  async getRoutesForTa(agencyId: number): Promise<RouteEntity[]> {
    console.log(
      "[getRoutesForTa] Starting with agencyId:",
      "agencyId:",
      agencyId,
    );

    console.log(
      "[getRoutesForTa] Trying BY_AGENCY endpoint:",
      TRAVEL_AGENCY_API.ROUTES.BY_AGENCY(agencyId),
    );
    let response: RouteEntity[] | null = null;
    try {
      const res = await api.get(TRAVEL_AGENCY_API.ROUTES.BY_AGENCY(agencyId));
      response = res.data;
      console.log("[getRoutesForTa] BY_AGENCY response:", response);
    } catch (err) {
      console.warn("[getRoutesForTa] BY_AGENCY failed:", err);
    }
    if (response && Array.isArray(response) && response.length > 0) {
      console.log(
        "[getRoutesForTa] Returning",
        response.length,
        "routes from BY_AGENCY",
      );
      return response;
    }

    console.log(
      "[getRoutesForTa] Falling back to tenant lookup. FULL_INFO endpoint:",
      TRAVEL_AGENCY_API.TENANTS.FULL_INFO(agencyId),
    );
    let tenant: TravelAgencyTenantWithNameEntity[] | null = null;
    try {
      const res = await api.get(TRAVEL_AGENCY_API.TENANTS.FULL_INFO(agencyId));
      tenant = res.data;
      console.log("[getRoutesForTa] Tenant response:", tenant);
    } catch (err) {
      console.warn("[getRoutesForTa] FULL_INFO failed:", err);
    }

    if (!tenant || tenant.length === 0) {
      console.error(
        "[getRoutesForTa] No tenants found for agencyId:",
        agencyId,
      );
      throw new Error("No routes found for the travel agency");
    }

    const ids = tenant
      .map((t) => t.tenant_id)
      .filter((id): id is number => id !== null);
    console.log(
      "[getRoutesForTa] Tenant IDs:",
      ids,
      "→ ROUTES endpoint:",
      ROUTES_API.AVAILABLE(ids),
    );

    let routes: RouteEntity[] | null = null;
    try {
      const res = await api.get(ROUTES_API.AVAILABLE(ids));
      routes = res.data;
      console.log("[getRoutesForTa] Routes from tenant IDs:", routes);
    } catch (err) {
      console.warn("[getRoutesForTa] ROUTES_API.AVAILABLE failed:", err);
    }

    if (routes && Array.isArray(routes) && routes.length > 0) {
      console.log(
        "[getRoutesForTa] Returning",
        routes.length,
        "routes from fallback",
      );
      return routes;
    }

    console.error("[getRoutesForTa] All attempts exhausted — no routes found");
    throw new Error("No routes found for the travel agent");
  }

  /**
   * Prepare booking data — fetch trips, cabins, rates for selected trip IDs
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async prepareBooking(
    searchParams: URLSearchParams | string,
  ): Promise<PreparedBookingData> {
    const queryString =
      typeof searchParams === "string" ? searchParams : searchParams.toString();

    const url = `${TRAVEL_AGENCY_API.BOOKINGS.PREPARE}?${queryString}`;
    console.log("[prepareBooking] GET", url);

    const response = await api.get<PreparedBookingData>(url);
    console.log("[prepareBooking] raw axios response.data:", response.data);
    return response.data;
  }

  /**
   * Create a booking through the tenant's client API
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async createBooking(
    bookingData: BookingFormData,
  ): Promise<SuccessResponse<BookingView>> {
    // Map form data for the API (same as TMS pattern)
    const payload: Record<string, unknown> = { ...bookingData };

    // Map contact info to passengers
    if (Array.isArray(payload.passengers)) {
      payload.passengers = (
        payload.passengers as Record<string, unknown>[]
      ).map((passenger) => ({
        ...passenger,
        address:
          (passenger.address as string) || (payload.contactAddress as string),
        mobileNumber:
          (passenger.mobileNumber as string) ||
          (payload.contactMobileNumber as string),
        email: (passenger.email as string) || (payload.contactEmail as string),
      }));
    }

    // Map paymentMethod to payment_method
    if ("paymentMethod" in payload) {
      payload.payment_method = payload.paymentMethod;
    }

    // Remove root fields that cause backend errors
    delete payload.contactAddress;
    delete payload.contactMobileNumber;
    delete payload.contactEmail;
    delete payload.paymentMethod;

    // Clean up loose cargos
    if (Array.isArray(payload.looseCargos)) {
      payload.looseCargos = (
        payload.looseCargos as Record<string, unknown>[]
      ).map((cargo) => {
        const { volume: _volume, packageType: _packageType, ...rest } = cargo;
        return rest;
      });
    }

    // Set booking source as travel_agency
    payload.bookingSource = "otc";

    const response = await api.post<SuccessResponse<BookingView>>(
      TRAVEL_AGENCY_API.BOOKINGS.CREATE,
      payload,
    );
    return response.data;
  }

  /**
   * Find bookings from the tenant's client API
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async findBookings(
    query: FindBookingsQuery,
  ): Promise<SuccessResponse<PageResult<BookingView>>> {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }

    const response = await api.get<SuccessResponse<PageResult<BookingView>>>(
      `${TRAVEL_AGENCY_API.BOOKINGS.FIND}?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get a specific booking by ID
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async getBookingById(
    bookingId: string,
  ): Promise<SuccessResponse<BookingView>> {
    const response = await api.get<SuccessResponse<BookingView>>(
      TRAVEL_AGENCY_API.BOOKINGS.GET(bookingId),
    );
    return response.data;
  }

  /**
   * Calculate pricing preview for the booking form.
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async calculatePricing(
    pricingData: CalculatePricingRequest,
  ): Promise<SuccessResponse<CalculatePricingResponse>> {
    const response = await api.post<SuccessResponse<CalculatePricingResponse>>(
      TRAVEL_AGENCY_API.BOOKINGS.PRICING,
      pricingData,
    );
    return response.data;
  }
}

export const bookingService = new BookingService();
