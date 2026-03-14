import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { TRAVEL_AGENCY_API, TRIPS_API } from "@/constants/api_config";
import type {
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
} from "@/constants/types/booking.types";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { RouteEntity } from "@/constants";

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

    const response = await api.get<{ message: string; data: TripView[] }>(
      `${TRIPS_API.TRIP}?${params.toString()}`,
    );

    // API V2 returns { message, data: [...trips] } (already unwrapped by axios interceptor)
    const result = response.data;
    const trips = Array.isArray(result)
      ? (result as TripView[])
      : Array.isArray(result?.data)
        ? result.data
        : [];
    return { total: trips.length, data: trips };
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
    const res = await api.get(TRAVEL_AGENCY_API.ROUTES.BY_AGENCY(agencyId));
    const routes: RouteEntity[] = res.data;

    if (!Array.isArray(routes) || routes.length === 0) {
      return [];
    }

    return routes;
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
    console.log("[BookingService] prepareBooking URL:", url);
    const response = await api.get<PreparedBookingData>(url);
    console.log(
      "[BookingService] prepareBooking response:",
      JSON.stringify(response.data, null, 2),
    );
    return response.data;
  }

  /**
   * Create a booking through the tenant's client API
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async createBooking(bookingData: BookingFormData): Promise<BookingView> {
    // Map form data for the API (same as TMS pattern)
    const payload: Record<string, unknown> = { ...bookingData };

    // Map contact info to passengers and strip fields not in the client API DTO
    if (Array.isArray(payload.passengers)) {
      payload.passengers = (
        payload.passengers as Record<string, unknown>[]
      ).map((passenger) => {
        const { occupation, civilStatus, source, ...rest } = passenger;
        void occupation;
        void civilStatus;
        void source;
        return {
          ...rest,
          address:
            (rest.address as string) || (payload.contactAddress as string),
          mobileNumber:
            (rest.mobileNumber as string) ||
            (payload.contactMobileNumber as string),
          email: (rest.email as string) || (payload.contactEmail as string),
        };
      });
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

    // Strip ta_markup when zero or unset — backend only needs it when > 0
    if (!payload.ta_markup || (payload.ta_markup as number) <= 0) {
      delete payload.ta_markup;
    }

    // Clean up vehicles — strip fields not in the client API DTO
    if (Array.isArray(payload.vehicles)) {
      payload.vehicles = (payload.vehicles as Record<string, unknown>[]).map(
        (vehicle) => {
          const { modelYear, ...rest } = vehicle;
          void modelYear;
          return rest;
        },
      );
    }

    // Clean up loose cargos — strip fields not in the client API DTO
    if (Array.isArray(payload.looseCargos)) {
      payload.looseCargos = (
        payload.looseCargos as Record<string, unknown>[]
      ).map((cargo) => {
        const { packageType, ...rest } = cargo;
        void packageType;
        return rest;
      });
    }

    // Set booking source as travel_agency
    payload.bookingSource = "travel_agency";

    // Pass the global TA user ID + agency ID so the client API
    // can resolve the local booked_by_id in its own DB
    const user = useAuthStore.getState().user;
    if (user?.id) {
      payload.globalUserId = user.id;
    }
    if (user?.travel_agency_id) {
      payload.agencyId = user.travel_agency_id;
    }

    const response = await api.post<BookingView>(
      TRAVEL_AGENCY_API.BOOKINGS.CREATE,
      payload,
      { timeout: 60_000 },
    );
    return response.data;
  }

  async GetMyLocalId(user_id: string, agency_id: number): Promise<string> {
    const response = await api.get<{ local_id: string }>(
      `${TRAVEL_AGENCY_API.LOCAL.GET(user_id, agency_id)}`,
    );
    return response.data.local_id;
  }

  /**
   * Find bookings from the tenant's client API
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async findBookingsByAgent(
    query: FindBookingsQuery,
  ): Promise<PageResult<BookingView>> {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }

    const response = await api.get<PageResult<BookingView>>(
      `${TRAVEL_AGENCY_API.BOOKINGS.FIND}?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get a specific booking by ID
   * The backend extracts travel_agency_id from the JWT token automatically.
   */
  async getBookingById(bookingId: string): Promise<BookingView> {
    const response = await api.get<BookingView>(
      TRAVEL_AGENCY_API.BOOKINGS.GET(bookingId),
    );
    return response.data;
  }

  async calculatePricing(
    pricingData: CalculatePricingRequest,
  ): Promise<CalculatePricingResponse> {
    console.log(
      "[BookingService] calculatePricing request:",
      JSON.stringify(pricingData, null, 2),
    );
    const response = await api.post<CalculatePricingResponse>(
      TRAVEL_AGENCY_API.BOOKINGS.PRICING,
      pricingData,
    );
    console.log(
      "[BookingService] calculatePricing response:",
      JSON.stringify(response.data, null, 2),
    );
    return response.data;
  }
}

export const bookingService = new BookingService();
