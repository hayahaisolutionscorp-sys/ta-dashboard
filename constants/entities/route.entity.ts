export class RouteEntity {
  id!: number;
  tenant_routes_id!: number;
  dest_port_name!: string;
  dest_port_id!: number;
  dest_port_code!: string;
  src_port_name!: string;
  src_port_id!: number;
  src_port_code!: string;
  travel_agency_name!: string;
  max_flat_passenger_markup!: number;
  max_flat_cargo_markup!: number;
}
