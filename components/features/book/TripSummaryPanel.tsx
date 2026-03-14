"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  PreparedBookingData,
  BookingFormTrip,
  CalculatePricingRequest,
} from "@/constants/types/booking.types";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { usePricingCalculation } from "@/hooks/mutations/bookings/use-pricing-calculation";
import { useMemo } from "react";
import {
  IconShip,
  IconCalendar,
  IconRoute,
  IconUser,
  IconCar,
  IconPackage,
  IconLoader2,
} from "@tabler/icons-react";
import { useEffect } from "react";

interface TripSummaryPanelProps {
  bookingData: PreparedBookingData;
  allTrips: BookingFormTrip[];
  formData?: BookingFormData;
  onPricingLoadingChange?: (isLoading: boolean) => void;
}

export default function TripSummaryPanel({
  allTrips,
  formData,
  onPricingLoadingChange,
}: TripSummaryPanelProps) {
  const formatDateTime = (dateStr?: string): string => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-PH", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const departureTrips = allTrips.filter((t) => t.tripType === "departure");
  const returnTrips = allTrips.filter((t) => t.tripType === "return");

  // Build the pricing API request from form data
  const pricingRequest: CalculatePricingRequest | null = useMemo(() => {
    if (!formData || !allTrips.length) return null;

    const tripIds = allTrips.map((t) => t.id);
    const routeCode = allTrips.at(0)?.route_code ?? "";

    if (!routeCode) {
      console.log("[TripSummaryPanel] No route_code available on trips");
      return null;
    }

    const hasItems =
      (formData.passengers?.length ?? 0) > 0 ||
      (formData.vehicles?.length ?? 0) > 0 ||
      (formData.looseCargos?.length ?? 0) > 0;

    if (!hasItems) return null;

    // Map passengers to pricing input
    const passengers = (formData.passengers ?? []).map((pax, idx) => ({
      index: idx,
      passengerType: pax.tripAssignments?.at(0)?.discountType ?? "Adult",
      tripAssignments: (pax.tripAssignments ?? []).map((ta) => ({
        tripId: ta.tripId,
        cabinId: ta.cabinId,
        discountType: ta.discountType,
      })),
    }));

    // Map vehicles and loose cargos to cargo pricing inputs
    const cargos = [
      ...(formData.vehicles ?? []).map((veh, idx) => ({
        index: idx,
        cargoType: "rolling" as const,
        cargoClassCode: veh.cargoClassCode || undefined,
        vehicleTypeId: veh.vehicleTypeId || undefined,
        tripAssignments: (veh.tripAssignments ?? []).map((ta) => ({
          tripId: ta.tripId,
        })),
      })),
      ...(formData.looseCargos ?? []).map((cargo, idx) => ({
        index: (formData.vehicles?.length ?? 0) + idx,
        cargoType: "loose" as const,
        cargoClassCode: cargo.cargoClassCode || undefined,
        weight: cargo.weight,
        quantity: cargo.quantity,
        tripAssignments: (cargo.tripAssignments ?? []).map((ta) => ({
          tripId: ta.tripId,
        })),
      })),
    ];

    const request: CalculatePricingRequest = {
      routeCode,
      tripIds,
      passengers,
      cargos: cargos.length > 0 ? cargos : undefined,
    };

    console.log(
      "[TripSummaryPanel] Built pricing request:",
      JSON.stringify(request, null, 2),
    );
    return request;
  }, [formData, allTrips]);

  // Call the pricing API
  const {
    data: pricing,
    isLoading: isPricingLoading,
    isFetching: isPricingFetching,
  } = usePricingCalculation({
    request: pricingRequest,
  });

  // Notify parent when pricing loading state changes
  useEffect(() => {
    onPricingLoadingChange?.(isPricingLoading || isPricingFetching);
  }, [isPricingLoading, isPricingFetching, onPricingLoadingChange]);

  // Deep debug: log every time pricing changes
  useEffect(() => {
    console.log("[TripSummaryPanel] === PRICING DATA CHANGED ===");
    console.log("[TripSummaryPanel] pricing:", pricing);
    console.log("[TripSummaryPanel] pricing type:", typeof pricing);
    if (pricing) {
      console.log("[TripSummaryPanel] pricing keys:", Object.keys(pricing));
      console.log(
        "[TripSummaryPanel] passengerPrices:",
        JSON.stringify(pricing.passengerPrices),
      );
      console.log(
        "[TripSummaryPanel] cargoPrices:",
        JSON.stringify(pricing.cargoPrices),
      );
      console.log("[TripSummaryPanel] grandTotal:", pricing.grandTotal);
    }
    console.log("[TripSummaryPanel] isPricingLoading:", isPricingLoading);
  }, [pricing, isPricingLoading]);

  // Build display data from pricing response
  const passengerLines = useMemo(() => {
    if (!formData?.passengers) return [];

    return formData.passengers.map((pax, idx) => {
      const firstName = pax.firstName || `Passenger ${idx + 1}`;
      const assignment = pax.tripAssignments?.at(0);
      const discountType = assignment?.discountType || "Adult";
      const cabinId = assignment?.cabinId ?? null;

      // Find cabin name
      let cabinName = "";
      if (cabinId) {
        for (const trip of allTrips) {
          const cabin = trip.cabins?.find((c) => c.id === cabinId);
          if (cabin) {
            cabinName = cabin.name;
            break;
          }
        }
      }

      // Sum up all trip prices for this passenger from the pricing response
      const amount =
        pricing?.passengerPrices
          ?.filter((p) => p.index === idx)
          .reduce((sum, p) => sum + p.baseFare, 0) ?? 0;

      return { label: firstName, type: discountType, cabin: cabinName, amount };
    });
  }, [formData, pricing?.passengerPrices, allTrips]);

  const vehicleLines = useMemo(() => {
    if (!formData?.vehicles) return [];

    console.log(
      "[TripSummaryPanel] vehicleLines computing. vehicles:",
      formData.vehicles.length,
      "cargoPrices:",
      pricing?.cargoPrices,
    );

    return formData.vehicles.map((veh, idx) => {
      const label = veh.plateNumber || `Vehicle ${idx + 1}`;
      const classCode = veh.cargoClassCode || "—";

      const matchingPrices = pricing?.cargoPrices?.filter(
        (c) => c.index === idx && c.cargoType === "rolling",
      );
      console.log(
        `[TripSummaryPanel] Vehicle ${idx}: matchingPrices=`,
        matchingPrices,
      );

      const amount =
        matchingPrices?.reduce((sum, c) => sum + c.baseFare, 0) ?? 0;

      return { label, classCode, amount };
    });
  }, [formData, pricing?.cargoPrices]);

  const cargoLines = useMemo(() => {
    if (!formData?.looseCargos) return [];

    const vehicleCount = formData.vehicles?.length ?? 0;

    return formData.looseCargos.map((cargo, idx) => {
      const label = cargo.description || `Cargo ${idx + 1}`;
      const classCode = cargo.cargoClassCode || "—";
      const qty = cargo.quantity ?? 1;

      const cargoIdx = vehicleCount + idx;
      const amount =
        pricing?.cargoPrices
          ?.filter((c) => c.index === cargoIdx && c.cargoType === "loose")
          .reduce((sum, c) => sum + c.baseFare, 0) ?? 0;

      return { label, classCode, quantity: qty, amount };
    });
  }, [formData, pricing?.cargoPrices]);

  const passengerTotal = passengerLines.reduce((s, l) => s + l.amount, 0);
  const vehicleTotal = vehicleLines.reduce((s, l) => s + l.amount, 0);
  const cargoTotal = cargoLines.reduce((s, l) => s + l.amount, 0);

  const hasItems =
    passengerLines.length > 0 ||
    vehicleLines.length > 0 ||
    cargoLines.length > 0;

  const markupAmount = formData?.ta_markup ?? 0;

  // Use the grand total from pricing API if available, otherwise sum base fares
  const baseTotal =
    pricing?.grandTotal ?? passengerTotal + vehicleTotal + cargoTotal;
  const grandTotal = baseTotal + markupAmount;

  return (
    <div className="sticky top-20 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Trip Summary
      </h3>

      {departureTrips.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                Departure
              </Badge>
            </div>
            {departureTrips.map((trip, idx) => (
              <TripCard
                key={`dep-${idx}`}
                trip={trip}
                formatDateTime={formatDateTime}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {returnTrips.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                Return
              </Badge>
            </div>
            {returnTrips.map((trip, idx) => (
              <TripCard
                key={`ret-${idx}`}
                trip={trip}
                formatDateTime={formatDateTime}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pricing Breakdown */}
      {hasItems && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Estimated Pricing
              </h4>
              {isPricingLoading && (
                <IconLoader2 className="h-3 w-3 text-gray-400 animate-spin" />
              )}
            </div>

            {/* Passengers */}
            {passengerLines.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                  <IconUser className="h-3 w-3" />
                  <span>Passengers</span>
                </div>
                {passengerLines.map((line, idx) => (
                  <div
                    key={`pax-${idx}`}
                    className="flex items-center justify-between text-xs pl-4"
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span className="truncate">{line.label}</span>
                      <span className="text-gray-400 shrink-0">
                        ({line.type}
                        {line.cabin ? `, ${line.cabin}` : ""})
                      </span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">
                      {line.amount > 0 ? formatCurrency(line.amount) : "—"}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium pl-4 text-blue-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(passengerTotal)}</span>
                </div>
              </div>
            )}

            {/* Vehicles */}
            {vehicleLines.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700">
                  <IconCar className="h-3 w-3" />
                  <span>Vehicles</span>
                </div>
                {vehicleLines.map((line, idx) => (
                  <div
                    key={`veh-${idx}`}
                    className="flex items-center justify-between text-xs pl-4"
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span className="truncate">{line.label}</span>
                      <span className="text-gray-400 shrink-0">
                        ({line.classCode})
                      </span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">
                      {line.amount > 0 ? formatCurrency(line.amount) : "—"}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium pl-4 text-purple-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(vehicleTotal)}</span>
                </div>
              </div>
            )}

            {/* Cargos */}
            {cargoLines.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <IconPackage className="h-3 w-3" />
                  <span>Cargo</span>
                </div>
                {cargoLines.map((line, idx) => (
                  <div
                    key={`crg-${idx}`}
                    className="flex items-center justify-between text-xs pl-4"
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span className="truncate">{line.label}</span>
                      <span className="text-gray-400 shrink-0">
                        (×{line.quantity}, {line.classCode})
                      </span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">
                      {line.amount > 0 ? formatCurrency(line.amount) : "—"}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium pl-4 text-amber-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cargoTotal)}</span>
                </div>
              </div>
            )}

            {/* Charges breakdown (if any) */}
            {pricing?.charges && pricing.charges.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500">
                  Charges & Taxes
                </div>
                {pricing.charges
                  .filter((c) => !c.isInclusive && c.showOnReceipt)
                  .map((charge, idx) => (
                    <div
                      key={`charge-${idx}`}
                      className="flex items-center justify-between text-xs pl-4"
                    >
                      <span className="text-gray-500">{charge.chargeName}</span>
                      <span className="font-medium">
                        {formatCurrency(charge.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Agent Markup */}
            {markupAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Agent Markup</span>
                <span className="font-medium">
                  +{formatCurrency(markupAmount)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Estimated Total</span>
              <span className="text-sm font-bold text-green-700">
                {isPricingLoading ? "..." : formatCurrency(grandTotal)}
              </span>
            </div>
            {grandTotal === 0 && hasItems && !isPricingLoading && (
              <p className="text-[10px] text-gray-400">
                Rates not available — prices will be calculated on submission
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TripCard({
  trip,
  formatDateTime,
}: {
  trip: BookingFormTrip;
  formatDateTime: (dateStr?: string) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconRoute className="h-3 w-3" />
        <span>
          {trip.origin ?? "—"} → {trip.destination ?? "—"}
        </span>
      </div>
      {trip.ship?.name && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconShip className="h-3 w-3" />
          <span>{trip.ship.name}</span>
        </div>
      )}
      {trip.scheduled_departure && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconCalendar className="h-3 w-3" />
          <span>{formatDateTime(trip.scheduled_departure)}</span>
        </div>
      )}
    </div>
  );
}
