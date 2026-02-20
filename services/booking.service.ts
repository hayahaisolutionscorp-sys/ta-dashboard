import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import { useAuthStore } from "@/lib/stores/auth.store";
import type {
  SuccessResponse,
  PreparedBookingData,
  BookingView,
  PageResult,
  FindBookingsQuery,
  AvailableTripsQuery,
  AvailableTripsResult,
} from "@/lib/types/booking.types";
import type { BookingFormData } from "@/lib/validators/booking.validators";

class BookingService {
  private getTravelAgencyId(): number {
    const user = useAuthStore.getState().user;
    if (!user?.travel_agency_id) {
      throw new Error("No travel agency associated with this account");
    }
    return user.travel_agency_id;
  }

  /**
   * Search for available trips across tenants
   */
  async searchTrips(query: AvailableTripsQuery): Promise<AvailableTripsResult> {
    const params = new URLSearchParams();
    params.set("origin_code", query.origin_code);
    params.set("destination_code", query.destination_code);
    params.set("departure_date", query.departure_date);
    if (query.passenger_count) {
      params.set("passenger_count", String(query.passenger_count));
    }
    if (query.vehicle_count) {
      params.set("vehicle_count", String(query.vehicle_count));
    }
    if (query.page) {
      params.set("page", String(query.page));
    }
    if (query.sort) {
      params.set("sort", query.sort);
    }

    const response = await api.get<AvailableTripsResult>(
      `${TRAVEL_AGENCY_API.TRIPS.AVAILABLE}?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Prepare booking data — fetch trips, cabins, rates for selected trip IDs
   */
  async prepareBooking(
    searchParams: URLSearchParams | string,
  ): Promise<SuccessResponse<PreparedBookingData>> {
    const travelAgencyId = this.getTravelAgencyId();
    const queryString =
      typeof searchParams === "string" ? searchParams : searchParams.toString();

    const response = await api.get<SuccessResponse<PreparedBookingData>>(
      `${TRAVEL_AGENCY_API.BOOKINGS.PREPARE}?travel_agency_id=${travelAgencyId}&${queryString}`,
    );
    return response.data;
  }

  /**
   * Create a booking through the tenant's client API
   */
  async createBooking(
    bookingData: BookingFormData,
  ): Promise<SuccessResponse<BookingView>> {
    const travelAgencyId = this.getTravelAgencyId();

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
      `${TRAVEL_AGENCY_API.BOOKINGS.CREATE}?travel_agency_id=${travelAgencyId}`,
      payload,
    );
    return response.data;
  }

  /**
   * Find bookings from the tenant's client API
   */
  async findBookings(
    query: FindBookingsQuery,
  ): Promise<SuccessResponse<PageResult<BookingView>>> {
    const travelAgencyId = this.getTravelAgencyId();
    const params = new URLSearchParams();
    params.set("travel_agency_id", String(travelAgencyId));

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
   */
  async getBookingById(
    bookingId: string,
  ): Promise<SuccessResponse<BookingView>> {
    const travelAgencyId = this.getTravelAgencyId();
    const response = await api.get<SuccessResponse<BookingView>>(
      `${TRAVEL_AGENCY_API.BOOKINGS.GET(bookingId)}?travel_agency_id=${travelAgencyId}`,
    );
    return response.data;
  }
}

export const bookingService = new BookingService();
