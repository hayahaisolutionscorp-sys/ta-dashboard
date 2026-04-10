/**
 * BookingService — central service for the TA booking flow.
 *
 * Booking flow (in order):
 *  1. Routes      — getRoutesForTa()       fetch port-pair routes available to the agency
 *  2. Trip search — searchTrips()          find available trips for a route + date
 *                   getAvailableDates()    power the date picker with dates that have trips
 *  3. Prepare     — prepareBooking()       fetch trip details, cabin types, discount types,
 *                                          vehicle/cargo classes for the booking form
 *  4. Pricing     — calculatePricing()     get real-time fare breakdown before confirming
 *  5. Create      — createBooking()        submit the finalized booking to the client API
 *  6. Post-create — bulkInvalidate()       cancel seats/cargo on an existing booking
 *                   bulkRefund()           refund items on an existing booking
 *                   bulkRebook()           move items to a new trip on an existing booking
 *
 * All requests that require agency context (prepare, create, find, get, pricing,
 * bulk ops) are routed through the TA proxy in ayahay-api-v2, which extracts the
 * travel_agency_id from the TA JWT automatically.
 */
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
  BulkInvalidateRequest,
  BulkRefundRequest,
  BulkRebookRequest,
} from "@/constants/types/booking.types";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { RouteEntity } from "@/constants";

class BookingService {
  /**
   * Search for available trips on a given route and departure date.
   * Results are paginated and sorted by departureDate by default.
   * Used in step 2 of the booking flow (trip selection screen).
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
   * Get the list of dates that have at least one available trip for a route.
   * Powers the date picker on the trip search screen so only valid dates
   * are selectable.
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

  /**
   * Fetch the port-pair routes that a travel agency is allowed to book.
   * Used to populate the origin/destination selects and to look up the
   * agent's markup configuration for a specific route.
   */
  async getRoutesForTa(agencyId: number): Promise<RouteEntity[]> {
    const res = await api.get(TRAVEL_AGENCY_API.ROUTES.BY_AGENCY(agencyId));
    const routes: RouteEntity[] = res.data;

    if (!Array.isArray(routes) || routes.length === 0) {
      return [];
    }

    return routes;
  }

  /**
   * Prepare booking data for the selected trip IDs.
   * Returns trip details, available cabin types, discount types (passenger types),
   * vehicle classes, cargo classes, and accommodation codes needed to render
   * the booking form. The backend resolves travel_agency_id from the JWT.
   */
  async prepareBooking(
    searchParams: URLSearchParams | string,
  ): Promise<PreparedBookingData> {
    const queryString =
      typeof searchParams === "string" ? searchParams : searchParams.toString();

    const url = `${TRAVEL_AGENCY_API.BOOKINGS.PREPARE}?${queryString}`;
    const response = await api.get<PreparedBookingData>(url);
    return response.data;
  }

  /**
   * Submit a completed booking form to the client API.
   * Handles field mapping (camelCase ↔ snake_case), strips fields that are
   * not accepted by the client API DTO, sets bookingSource to "travel_agency",
   * and forwards the TA user's globalUserId + agencyId for local ID resolution.
   * Uses a 60-second timeout to accommodate slow downstream processing.
   */
  async createBooking(bookingData: BookingFormData): Promise<string> {
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

    // Map paymentMethod → payment_method; fall back to CASH only if missing
    if ("paymentMethod" in payload) {
      payload.payment_method = (payload.paymentMethod as string) ?? "CASH";
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

    // Map rateSnapshotId → snapshotId for the client API (ensures pricing consistency)
    if (payload.rateSnapshotId) {
      payload.snapshotId = payload.rateSnapshotId;
    }
    delete payload.rateSnapshotId;

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

    const response = await api.post<string>(
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

  /**
   * Calculate real-time pricing for the current form state.
   * Called by usePricingCalculation whenever passengers, cabins, or cargo
   * change. Returns per-passenger/cargo base fares, applied charges, tax
   * totals, and a snapshotId that locks the rates at submission time.
   */
  async calculatePricing(
    pricingData: CalculatePricingRequest,
  ): Promise<CalculatePricingResponse> {
    const response = await api.post<CalculatePricingResponse>(
      TRAVEL_AGENCY_API.BOOKINGS.PRICING,
      pricingData,
    );
    return response.data;
  }
  /**
   * Cancel (invalidate) selected passengers/cargo on an existing booking.
   * Used on the booking detail page to void individual items without
   * cancelling the entire booking.
   */
  async bulkInvalidate(bookingId: string, data: BulkInvalidateRequest) {
    const response = await api.post(
      TRAVEL_AGENCY_API.BOOKINGS.BULK_INVALIDATE(bookingId),
      data,
    );
    return response.data;
  }

  /**
   * Issue refunds for selected passengers/cargo on an existing booking.
   */
  async bulkRefund(bookingId: string, data: BulkRefundRequest) {
    const response = await api.post(
      TRAVEL_AGENCY_API.BOOKINGS.BULK_REFUND(bookingId),
      data,
    );
    return response.data;
  }

  /**
   * Move selected passengers/cargo from an existing booking to a new trip.
   * Uses a 60-second timeout because the operation creates new booking records
   * in the client API.
   */
  async bulkRebook(bookingId: string, data: BulkRebookRequest) {
    const response = await api.post(
      TRAVEL_AGENCY_API.BOOKINGS.BULK_REBOOK(bookingId),
      data,
      { timeout: 60_000 },
    );
    return response.data;
  }
}

export const bookingService = new BookingService();
