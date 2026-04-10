// ==================== Commission Types ====================

export type CommissionType = "fixed" | "percentage";

export interface CommissionConfig {
  passengerCommissionType: CommissionType;
  passengerCommissionValue: number;
  cargoCommissionType: CommissionType;
  cargoCommissionValue: number;
}

export const ZERO_COMMISSION_CONFIG: CommissionConfig = {
  passengerCommissionType: "fixed",
  passengerCommissionValue: 0,
  cargoCommissionType: "fixed",
  cargoCommissionValue: 0,
};

// ==================== API Response Types ====================

export interface SuccessResponse<T> {
  message: string;
  data: T;
}

export interface PageResult<T> {
  results: T[];
  total: number;
}

// ==================== Trip Types ====================

export interface TripSegmentView {
  id: string;
  ship_id: number;
  ship_name: string;
  route_id: number;
  source_port_code: string;
  source_port_name: string;
  destination_port_code: string;
  destination_port_name: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  base_fare?: number | null;
  currency?: string | null;
}

export interface TripView {
  id: string;
  type: "direct" | "connecting";
  segment_count: number;
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  total_departure_time: string;
  total_arrival_time: string;
  total_duration_minutes: number;
  total_layover_minutes: number;
  intermediate_ports: string[];
  segments: TripSegmentView[];
  // Legacy fields kept for backward compat
  route_id?: number;
  ship_id?: number;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  status?: string;
  ship?: { id: number; name: string; cabins: CabinView[] };
  route?: {
    id: number;
    src_port_code: string;
    src_port_name: string;
    dest_port_code: string;
    dest_port_name: string;
  };
}

export interface CabinView {
  id: number;
  name: string;
  capacity?: number;
  available?: number;
}

// ==================== Client API Trip Summary (from /bookings/prepare) ====================

export interface CabinSummary {
  id: number;
  name: string;
  capacity: number;
}

export interface ShipSummary {
  id: number;
  name: string;
  cabins: CabinSummary[];
}

export interface TripSummary {
  id: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  origin: string;
  destination: string;
  route_code: string;
  ship: ShipSummary | null;
}

/**
 * Extended trip type used in the booking form.
 * Combines TripSummary with form-specific fields (tripType, sequence, cabins).
 */
export interface BookingFormTrip extends TripSummary {
  tripType: "departure" | "return";
  sequence: number;
  cabins: CabinSummary[];
}

// ==================== Booking Rate Types ====================

export interface PassengerRate {
  passenger_type_code: string;
  accom_code: string;
  amount: number;
  currency: string;
}

export interface CargoRate {
  cargo_type_code?: string;
  cargo_class_code: string;
  amount: number;
  currency: string;
  rate_unit?: string;
}

export interface BookingRateSnapshot {
  passenger_rates: PassengerRate[];
  cargo_rates: CargoRate[];
}

// ==================== Prepared Booking Types ====================

export interface PreparedBookingData {
  departure: TripSummary[];
  return: TripSummary[];
  routePreference?: Record<string, unknown>;
  passengerTypes: string[];
  vehicleClasses: VehicleClassOption[];
  cargoClasses: CargoClassOption[];
  accommodationCodes: string[];
  bookingUiSettings?: Record<string, unknown>;
  rates?: BookingRateSnapshot[];
}

export interface VehicleClassOption {
  code: string;
  display: string;
  vehicleTypeId?: number;
}

export interface CargoClassOption {
  code: string;
  display: string;
}

// ==================== Booking Create Response ====================

/**
 * After the axios response interceptor unwraps { data, message, ... },
 * createBooking resolves to just the booking UUID string.
 */
export type CreateBookingResponse = string;

// ==================== Booking View Types ====================

export interface BookingView {
  id: string;
  reference_no?: string;
  booking_type: string;
  source: string;
  booking_status: string;
  status: string;
  remarks?: string;
  payment_method?: string;
  has_passengers: boolean;
  has_cargo: boolean;
  booking_created_at: string;
  booking_updated_at?: string;
  booking_date?: string;
  issued_by?: string;
  booked_by_id?: string;
  booked_by_travel_agent_id?: string;
  booked_by_agent_name?: string;
  first_departure?: string;
  last_arrival?: string;
  ships_used?: string;
  route_summary?: string;
  total_trips?: string;
  is_round_trip?: boolean;
  total_passengers?: string;
  total_cargo_items?: string;
  total_price?: string;
  price_without_markup?: string;
  ta_markup?: string;
  bir_invoice_no?: string;
  ta_passenger_commission?: string | null;
  ta_cargo_commission?: string | null;
  payment_status?: string;
  payment_status_raw?: string;
  payment_date?: string;
  // Detailed trip data (from findOne)
  trips?: {
    departure: BookingTripDetail[];
    return: BookingTripDetail[];
  };
  // Payment records (from findOne)
  payments?: BookingPaymentView[];
}

export interface BookingTripDetail {
  id: string;
  origin: string;
  destination: string;
  ship_name: string;
  departure: string;
  arrival: string;
  sequence: number;
  passengers: BookingTripPassengerView[];
  vehicles: BookingTripVehicleView[];
  cargos: BookingTripCargoView[];
  cargo: BookingTripCargoView[];
}

export interface BookingTripPassengerView {
  booking_trip_passenger_id: string;
  bookingTripPassengerId: string;
  name: string;
  first_name: string;
  firstName?: string;
  last_name: string;
  lastName?: string;
  sex: string;
  birthday: string;
  nationality?: string;
  email?: string;
  mobile_number?: string;
  mobileNumber?: string;
  discount_type?: string;
  discountType?: string;
  cabin_id?: number | null;
  cabinId?: number | null;
  cabin?: string;
  cabinName?: string;
  accommodation?: string;
  cabin_type_name?: string;
  cabinTypeName?: string;
  price: number;
  booking_status?: string;
  bookingStatus?: string;
  removed_reason?: string;
  removedReason?: string;
  removed_reason_type?: string;
  removedReasonType?: string;
  checked_in: boolean;
  checked_in_at?: string;
  checkInStatus: string;
  checkInTime?: string;
}

export interface BookingTripVehicleView {
  booking_trip_cargo_id: string;
  bookingTripCargoId: string;
  id: string;
  plate_number: string;
  plateNumber: string;
  make?: string;
  model?: string;
  type?: string;
  vehicleTypeId?: number;
  cargoClassCode?: string;
  price: number;
  booking_status?: string;
  bookingStatus?: string;
  removed_reason?: string;
  removedReason?: string;
  removed_reason_type?: string;
  removedReasonType?: string;
  driver_passenger_id?: string;
  driverPassengerId?: string;
  checked_in: boolean;
  checkInStatus: string;
  checkInTime?: string;
}

export interface BookingTripCargoView {
  booking_trip_cargo_id: string;
  bookingTripCargoId: string;
  id: string;
  description: string;
  weight: number;
  unitWeight: number;
  quantity: number;
  cargo_type: string;
  cargoClassCode?: string;
  price: number;
  booking_status?: string;
  bookingStatus?: string;
  removed_reason?: string;
  removedReason?: string;
  removed_reason_type?: string;
  removedReasonType?: string;
  owner_passenger_id?: string;
  ownerPassengerId?: string;
  checked_in: boolean;
  checkInStatus: string;
  checkInTime?: string;
}

export interface BookingPaymentView {
  id: string;
  payment_method?: string;
  amount: number;
  payment_status?: string;
  payment_date?: string;
  transaction_number?: string;
  epayment_method?: string;
  cheque_number?: string;
  account_name?: string;
  payee_name?: string;
  issuer_name?: string;
  cheque_date?: string;
}

// ==================== Search/Filter Types ====================

export interface FindBookingsQuery {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  booking_type?: string;
  date_from?: string;
  date_to?: string;
  userId?: string;
  agencyId?: number | null;
}

export interface AvailableTripsQuery {
  origin_code: string;
  destination_code: string;
  departure_date: string;
  passenger_count?: number;
  vehicle_count?: number;
  page?: number;
  sort?: string;
}

export interface AvailableTripsResult {
  total: number;
  data: TripView[];
}

// ==================== Available Dates Types ====================

export interface AvailableDateItem {
  date: string;
  trip_count: number;
}

// ==================== Pricing Types ====================

export interface PricingTripAssignment {
  tripId: string;
  cabinId?: number | null;
  discountType?: string;
}

export interface PassengerPricingInput {
  index: number;
  passengerType: string;
  tripAssignments: PricingTripAssignment[];
}

export interface CargoPricingInput {
  index: number;
  cargoType: "rolling" | "loose";
  cargoClassCode?: string;
  weight?: number;
  quantity?: number;
  volume?: number;
  vehicleTypeId?: number;
  tripAssignments: PricingTripAssignment[];
}

export interface CalculatePricingRequest {
  routeCode: string;
  routeCodes?: string[];
  snapshotId?: number;
  tripIds: string[];
  passengers: PassengerPricingInput[];
  cargos?: CargoPricingInput[];
}

export interface PassengerPriceDetail {
  index: number;
  tripId: string;
  routeCode: string;
  passengerType: string;
  accommodationCode: string;
  baseFare: number;
  currency: string;
}

export interface CargoPriceDetail {
  index: number;
  tripId: string;
  routeCode: string;
  cargoType: "rolling" | "loose";
  cargoClassCode: string;
  baseFare: number;
  insuranceAmount?: number;
  currency: string;
  rateUnit?: string;
}

export interface ChargeDetail {
  ruleId: string;
  chargeCode: string;
  chargeName: string;
  category: string;
  amount: number;
  isInclusive: boolean;
  calcType: string;
  basis: string;
  showOnReceipt: boolean;
  service_domain: string;
}

export interface CalculatePricingResponse {
  snapshotId?: number;
  passengerPrices: PassengerPriceDetail[];
  cargoPrices: CargoPriceDetail[];
  baseFare: { passengers: number; cargo: number; total: number };
  charges: ChargeDetail[];
  chargesTotal: number;
  taxesTotal: number;
  subtotal: number;
  grandTotal: number;
}

// ==================== Bulk Action Types ====================

export interface TripSelection {
  tripId: string;
  passengerIds: string[];
  vehicleIds: string[];
}

export interface BulkInvalidateRequest {
  selectedPassengerIds?: string[];
  selectedVehicleIds?: string[];
  selectedCargoIds?: string[];
  remarks: string;
  reasonType?: string;
  tripSelections?: TripSelection[];
}

export interface BulkRefundRequest {
  selectedPassengerIds?: string[];
  selectedVehicleIds?: string[];
  selectedCargoIds?: string[];
  remarks: string;
  reasonType?: string;
  tripSelections?: TripSelection[];
}

export interface BulkRebookRequest {
  passengerIds?: string[];
  cargoIds?: string[];
  newBookingData: Record<string, unknown>;
}
