export interface MarkupEntity {
  travel_agent_id: string;
  travel_agency_route_id: number;
  flat_passenger_markup: number;
  percentage_passenger_markup: number;
  max_passenger_markup: number;
  flat_cargo_markup: number;
  percentage_cargo_markup: number;
  max_cargo_markup: number;
}

export interface CreateMarkupPayload {
  travel_agent_id: string;
  travel_agency_route_id: number;
  flat_passenger_markup?: number;
  percentage_passenger_markup?: number;
  flat_cargo_markup?: number;
  percentage_cargo_markup?: number;
}

export interface UpdateMarkupPayload {
  flat_passenger_markup?: number;
  percentage_passenger_markup?: number;
  flat_cargo_markup?: number;
  percentage_cargo_markup?: number;
}

export interface AgencyAgent {
  id: string;
  travel_agent_name: string;
  email: string;
  role: "Admin" | "Staff";
}
