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
  departure: TripView[];
  return: TripView[];
  routePreference?: Record<string, unknown>;
  passengerTypes: string[];
  vehicleClasses: VehicleClassOption[];
  cargoClasses: CargoClassOption[];
  accommodationCodes: string[];
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

// ==================== Booking View Types ====================

export interface BookingView {
  id: string;
  reference_code?: string;
  booking_type: string;
  booking_source: string;
  status: string;
  consignee?: string;
  remarks?: string;
  payment_method?: string;
  total_amount?: number;
  created_at: string;
  updated_at?: string;
  passengers?: BookingPassengerView[];
  vehicles?: BookingVehicleView[];
  looseCargos?: BookingLooseCargoView[];
  trips?: BookingTripView[];
}

export interface BookingPassengerView {
  id: string;
  first_name: string;
  last_name: string;
  sex: string;
  birthday: string;
  address?: string;
  nationality?: string;
  mobile_number?: string;
  email?: string;
  discount_type?: string;
}

export interface BookingVehicleView {
  id: string;
  plate_number: string;
  model_name: string;
  make?: string;
  vehicle_type?: string;
}

export interface BookingLooseCargoView {
  id: string;
  description: string;
  quantity: number;
  weight?: number;
}

export interface BookingTripView {
  id: string;
  trip_id: string;
  trip_type: string;
  departure_date?: string;
  route?: {
    src_port_name: string;
    dest_port_name: string;
  };
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
  tripAssignments: PricingTripAssignment[];
}

export interface CalculatePricingRequest {
  routeCode: string;
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
}

export interface CalculatePricingResponse {
  passengerPrices: PassengerPriceDetail[];
  cargoPrices: CargoPriceDetail[];
  baseFare: { passengers: number; cargo: number; total: number };
  charges: ChargeDetail[];
  chargesTotal: number;
  taxesTotal: number;
  subtotal: number;
  grandTotal: number;
}
