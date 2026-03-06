export interface PassengerRate {
  id: string;
  route_code: string;
  rate_snapshot_id: string;
  passenger_type_code: string;
  accom_code: string;
  currency: string;
  amount: number;
  pricing_mode: string;
  passenger_fare_rule_id: string | null;
  tenant_name?: string;
}

export interface CargoRate {
  id: string;
  route_code: string;
  rate_snapshot_id: string;
  cargo_type_code: string;
  cargo_class_code: string;
  rate_unit: string;
  currency: string;
  amount: number;
  vehicle_type_id: string | null;
  tenant_name?: string;
}

export interface RouteRates {
  route_code: string;
  passenger_rates: PassengerRate[];
  cargo_rates: CargoRate[];
  tenants: string[];
}
