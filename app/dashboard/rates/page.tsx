"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRatesForRoute } from "@/hooks/queries/rates/use-rates";
import { useRoutesForAgency } from "@/hooks/queries/routes/use-routes";
import type { PassengerRate, CargoRate } from "@/constants/types/rate.types";
import {
  RouteSelector,
  StatsCards,
  MarkupSection,
  RatesSection,
} from "./_components";

export default function RatesPage() {
  const [search, setSearch] = useState("");
  const [selectedRouteCode, setSelectedRouteCode] = useState<string | null>(
    null,
  );

  const currentUser = useAuthStore((s) => s.user);
  const agencyId = currentUser?.travel_agency_id;

  const { data: routes, isLoading: routesLoading } =
    useRoutesForAgency(agencyId);

  // Auto-select first route once loaded
  const activeRouteCode =
    selectedRouteCode ??
    (routes && routes.length > 0
      ? `${routes.at(0)?.src_port_code}-${routes.at(0)?.dest_port_code}`
      : null);

  const selectedRoute = routes?.find(
    (r) => `${r.src_port_code}-${r.dest_port_code}` === activeRouteCode,
  );

  const routeLabel = selectedRoute
    ? `${selectedRoute.src_port_name} → ${selectedRoute.dest_port_name}`
    : (activeRouteCode ?? "");

  const { data: ratesData, isLoading: ratesLoading } =
    useRatesForRoute(activeRouteCode);

  const passengerRates: PassengerRate[] = ratesData?.passenger_rates ?? [];
  const cargoRates: CargoRate[] = ratesData?.cargo_rates ?? [];

  const filteredPassenger = passengerRates.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.passenger_type_code.toLowerCase().includes(q) ||
      r.accom_code.toLowerCase().includes(q) ||
      (r.tenant_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredCargo = cargoRates.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.cargo_type_code.toLowerCase().includes(q) ||
      r.cargo_class_code.toLowerCase().includes(q) ||
      (r.tenant_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const uniqueTenants = [
    ...new Set([
      ...passengerRates.map((r) => r.tenant_name).filter(Boolean),
      ...cargoRates.map((r) => r.tenant_name).filter(Boolean),
    ]),
  ] as string[];

  const isLoading = routesLoading || ratesLoading;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
          <p className="text-muted-foreground">
            View ferry rates and pricing for your available routes
          </p>
        </div>

        {/* Route Selector + Search */}
        <RouteSelector
          routes={routes}
          routesLoading={routesLoading}
          activeRouteCode={activeRouteCode}
          onSelectRoute={(code) => {
            setSelectedRouteCode(code);
            setSearch("");
          }}
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
        />

        {/* Stats */}
        <StatsCards
          routesCount={routes?.length ?? 0}
          maxFlatPassengerMarkup={selectedRoute?.max_flat_passenger_markup}
          maxFlatCargoMarkup={selectedRoute?.max_flat_cargo_markup}
          routesLoading={routesLoading}
          isLoading={isLoading}
        />

        {/* Markup — shown first, before rates */}
        {activeRouteCode && (
          <MarkupSection
            agentId={currentUser?.id}
            selectedRoute={selectedRoute}
            routeLabel={routeLabel}
          />
        )}

        {/* Rates Table */}
        <RatesSection
          activeRouteCode={activeRouteCode}
          filteredPassenger={filteredPassenger}
          filteredCargo={filteredCargo}
          uniqueTenants={uniqueTenants}
          isLoading={isLoading}
          search={search}
        />
      </div>
    </div>
  );
}
