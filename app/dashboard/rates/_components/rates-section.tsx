"use client";

import { IconRoute, IconShip, IconCoin } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PassengerRate, CargoRate } from "@/constants/types/rate.types";

function formatCurrency(amount: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

interface RatesSectionProps {
  activeRouteCode: string | null;
  filteredPassenger: PassengerRate[];
  filteredCargo: CargoRate[];
  uniqueTenants: string[];
  isLoading: boolean;
  search: string;
}

export function RatesSection({
  activeRouteCode,
  filteredPassenger,
  filteredCargo,
  uniqueTenants,
  isLoading,
  search,
}: RatesSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {activeRouteCode ? `Rates — ${activeRouteCode}` : "Route Rates"}
          </CardTitle>
          {uniqueTenants.length > 0 && (
            <p className="text-muted-foreground mt-1 text-sm">
              Operators:{" "}
              {uniqueTenants.map((t) => (
                <Badge key={t} variant="outline" className="mr-1 text-xs">
                  {t}
                </Badge>
              ))}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!activeRouteCode ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
            <IconRoute className="mb-4 h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">Select a route</p>
            <p className="text-sm">
              Choose a route from the dropdown to view its rates.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="passenger">
            <TabsList className="mb-4">
              <TabsTrigger value="passenger">
                Passenger
                {!isLoading && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredPassenger.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cargo">
                Cargo / Vehicles
                {!isLoading && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredCargo.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="passenger">
              <PassengerRatesTable
                rates={filteredPassenger}
                isLoading={isLoading}
                search={search}
              />
            </TabsContent>

            <TabsContent value="cargo">
              <CargoRatesTable
                rates={filteredCargo}
                isLoading={isLoading}
                search={search}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function PassengerRatesTable({
  rates,
  isLoading,
  search,
}: {
  rates: PassengerRate[];
  isLoading: boolean;
  search: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`passenger-skeleton-${i}`} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center">
        <IconShip className="mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium">No passenger rates found</p>
        <p className="text-sm">
          {search
            ? "Try adjusting your search."
            : "No snapshot published for this route yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b">
            <th className="py-3 pr-6 text-left text-sm font-semibold tracking-wide">
              Passenger Type
            </th>
            <th className="py-3 pr-6 text-left text-sm font-semibold tracking-wide">
              Accommodation
            </th>
            <th className="py-3 pr-6 text-left text-sm font-semibold tracking-wide">
              Mode
            </th>
            <th className="py-3 pr-6 text-right text-sm font-semibold tracking-wide">
              Fare
            </th>
            <th className="py-3 text-left text-sm font-semibold tracking-wide">
              Operator
            </th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate, i) => (
            <tr
              key={`passenger-${rate.id ?? i}`}
              className="border-b last:border-0 hover:bg-muted/40 transition-colors"
            >
              <td className="py-3 pr-6">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                  {rate.passenger_type_code}
                </span>
              </td>
              <td className="py-3 pr-6">
                <span className="rounded-md bg-secondary px-2.5 py-1 text-sm font-medium">
                  {rate.accom_code}
                </span>
              </td>
              <td className="py-3 pr-6">
                <Badge variant="secondary" className="text-xs">
                  {rate.pricing_mode === "FARE_RULE"
                    ? "Fare Rule"
                    : "Base Rate"}
                </Badge>
              </td>
              <td className="py-3 pr-6 text-right text-base font-bold">
                {formatCurrency(Number(rate.amount), rate.currency)}
              </td>
              <td className="text-muted-foreground py-3 text-sm">
                {rate.tenant_name ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CargoRatesTable({
  rates,
  isLoading,
  search,
}: {
  rates: CargoRate[];
  isLoading: boolean;
  search: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`cargo-skeleton-${i}`} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center">
        <IconCoin className="mb-3 h-10 w-10 opacity-40" />
        <p className="font-medium">No cargo rates found</p>
        <p className="text-sm">
          {search
            ? "Try adjusting your search."
            : "No snapshot published for this route yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b">
            <th className="py-3 pr-6 text-left text-sm font-semibold tracking-wide">
              Cargo Type
            </th>
            <th className="py-3 pr-6 text-left text-sm font-semibold tracking-wide">
              Class
            </th>
            <th className="py-3 pr-6 text-left text-sm font-semibold tracking-wide">
              Rate Unit
            </th>
            <th className="py-3 pr-6 text-right text-sm font-semibold tracking-wide">
              Amount
            </th>
            <th className="py-3 text-left text-sm font-semibold tracking-wide">
              Operator
            </th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate, i) => (
            <tr
              key={`cargo-${rate.id ?? i}`}
              className="border-b last:border-0 hover:bg-muted/40 transition-colors"
            >
              <td className="py-3 pr-6">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                  {rate.cargo_type_code}
                </span>
              </td>
              <td className="py-3 pr-6">
                <span className="rounded-md bg-secondary px-2.5 py-1 text-sm font-medium">
                  {rate.cargo_class_code}
                </span>
              </td>
              <td className="text-muted-foreground py-3 pr-6 text-sm">
                {rate.rate_unit}
              </td>
              <td className="py-3 pr-6 text-right text-base font-bold">
                {formatCurrency(Number(rate.amount), rate.currency)}
              </td>
              <td className="text-muted-foreground py-3 text-sm">
                {rate.tenant_name ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
