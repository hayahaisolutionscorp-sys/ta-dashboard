/**
 * TripSummaryPanel — real-time pricing sidebar on the create booking page.
 *
 * Responsibilities:
 *  - Builds a CalculatePricingRequest from the live form state and sends it
 *    to the pricing API via usePricingCalculation whenever passengers, cabins,
 *    cargo classes, or markup change.
 *  - For round trips, renders a per-leg breakdown (Departure / Return) by
 *    matching PassengerPriceDetail.tripId and CargoPriceDetail.tripId against
 *    each trip's ID. Charges are split evenly between legs.
 *  - Groups charges by service_domain (PASSENGER / VEHICLE / CARGO) and
 *    labels them accordingly within each leg block.
 *  - Surfaces the snapshotId from the pricing response to the parent form
 *    via the onSnapshotId callback so rates are locked at submission time.
 *  - Sets isPricingLoading in useBookingFormUiStore so pricing-sensitive
 *    selects in sibling section components can be disabled during a fetch.
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  PreparedBookingData,
  BookingFormTrip,
  CalculatePricingRequest,
  ChargeDetail,
} from "@/constants/types/booking.types";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { usePricingCalculation } from "@/hooks/mutations/bookings/use-pricing-calculation";
import { useBookingFormUiStore } from "@/lib/stores/booking-form-ui.store";
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
  onSnapshotId?: (snapshotId: number) => void;
  commissionAmount?: number;
}

interface PassengerLine {
  label: string;
  type: string;
  cabin: string;
  amount: number;
}

interface VehicleLine {
  label: string;
  classCode: string;
  amount: number;
}

interface CargoLine {
  label: string;
  classCode: string;
  quantity: number;
  amount: number;
}

interface TripPricingGroup {
  tripType: "departure" | "return";
  tripLabel: string;
  passengers: PassengerLine[];
  vehicles: VehicleLine[];
  cargos: CargoLine[];
  passengerCharges: ChargeDetail[];
  vehicleCharges: ChargeDetail[];
  cargoCharges: ChargeDetail[];
}

export default function TripSummaryPanel({
  allTrips,
  formData,
  onSnapshotId,
  commissionAmount = 0,
}: TripSummaryPanelProps) {
  const setPricingLoading = useBookingFormUiStore((s) => s.setPricingLoading);

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
  const isRoundTrip = returnTrips.length > 0;

  // Build the pricing API request from form data
  const pricingRequest: CalculatePricingRequest | null = useMemo(() => {
    if (!formData || !allTrips.length) return null;

    const tripIds = allTrips.map((t) => t.id);
    const routeCode = allTrips.at(0)?.route_code ?? "";

    if (!routeCode) {
      return null;
    }

    const hasItems =
      (formData.passengers?.length ?? 0) > 0 ||
      (formData.vehicles?.length ?? 0) > 0 ||
      (formData.looseCargos?.length ?? 0) > 0;

    if (!hasItems) return null;

    const passengers = (formData.passengers ?? []).map((pax, idx) => ({
      index: idx,
      passengerType: pax.tripAssignments?.at(0)?.discountType ?? "Adult",
      tripAssignments: (pax.tripAssignments ?? []).map((ta) => ({
        tripId: ta.tripId,
        cabinId: ta.cabinId,
        discountType: ta.discountType,
      })),
    }));

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

    return request;
  }, [formData, allTrips]);

  const {
    data: pricing,
    isLoading: isPricingLoading,
    isFetching: isPricingFetching,
  } = usePricingCalculation({
    request: pricingRequest,
  });

  useEffect(() => {
    setPricingLoading(isPricingLoading || isPricingFetching);
  }, [isPricingLoading, isPricingFetching, setPricingLoading]);

  useEffect(() => {
    if (pricing?.snapshotId) {
      onSnapshotId?.(pricing.snapshotId);
    }
  }, [pricing?.snapshotId, onSnapshotId]);

  // Categorize charges by service_domain / basis
  const categorizedCharges = useMemo(() => {
    const visible = (pricing?.charges ?? []).filter(
      (c) => !c.isInclusive && c.showOnReceipt,
    );
    const passenger: ChargeDetail[] = [];
    const vehicle: ChargeDetail[] = [];
    const cargo: ChargeDetail[] = [];
    const other: ChargeDetail[] = [];

    for (const charge of visible) {
      const domain = charge.service_domain?.toUpperCase();
      const basis = charge.basis?.toUpperCase();

      if (domain === "PASSENGER" || basis === "PER_PAX") {
        passenger.push(charge);
      } else if (domain === "VEHICLE") {
        vehicle.push(charge);
      } else if (domain === "CARGO" || basis === "PER_CARGO") {
        cargo.push(charge);
      } else {
        other.push(charge);
      }
    }
    return { passenger, vehicle, cargo, other };
  }, [pricing?.charges]);

  // Build per-trip pricing groups
  const tripPricingGroups: TripPricingGroup[] = useMemo(() => {
    if (!formData) return [];

    // Helper: get trip IDs for a trip type
    const getTripIds = (tripType: "departure" | "return") =>
      allTrips.filter((t) => t.tripType === tripType).map((t) => t.id);

    const departureTripIds = new Set(getTripIds("departure"));
    const returnTripIds = new Set(getTripIds("return"));

    const buildGroup = (
      tripType: "departure" | "return",
      tripIds: Set<string>,
      label: string,
    ): TripPricingGroup => {
      // Passengers for this leg
      const passengers: PassengerLine[] = (formData.passengers ?? []).map((pax, idx) => {
        const firstName = pax.firstName || `Passenger ${idx + 1}`;
        // Find the trip assignment for this leg
        const assignment = pax.tripAssignments?.find((ta) => tripIds.has(ta.tripId));
        const discountType = assignment?.discountType || pax.tripAssignments?.at(0)?.discountType || "Adult";
        const cabinId = assignment?.cabinId ?? null;

        let cabinName = "";
        if (cabinId) {
          for (const trip of allTrips) {
            if (!tripIds.has(trip.id)) continue;
            const cabin = trip.cabins?.find((c) => c.id === cabinId);
            if (cabin) {
              cabinName = cabin.name;
              break;
            }
          }
        }

        const amount =
          pricing?.passengerPrices
            ?.filter((p) => p.index === idx && tripIds.has(p.tripId))
            .reduce((sum, p) => sum + p.baseFare, 0) ?? 0;

        return { label: firstName, type: discountType, cabin: cabinName, amount };
      });

      // Vehicles for this leg
      const vehicles: VehicleLine[] = (formData.vehicles ?? [])
        .map((veh, idx) => {
          const isAssigned = veh.tripAssignments?.some((ta) => tripIds.has(ta.tripId));
          if (!isAssigned) return null;

          const label = veh.plateNumber || `Vehicle ${idx + 1}`;
          const classCode = veh.cargoClassCode || "—";
          const amount =
            pricing?.cargoPrices
              ?.filter((c) => c.index === idx && c.cargoType === "rolling" && tripIds.has(c.tripId))
              .reduce((sum, c) => sum + c.baseFare, 0) ?? 0;

          return { label, classCode, amount };
        })
        .filter((v): v is VehicleLine => v !== null);

      // Loose cargo for this leg
      const vehicleCount = formData.vehicles?.length ?? 0;
      const cargos: CargoLine[] = (formData.looseCargos ?? [])
        .map((cargo, idx) => {
          const isAssigned = cargo.tripAssignments?.some((ta) => tripIds.has(ta.tripId));
          if (!isAssigned) return null;

          const label = cargo.description || `Cargo ${idx + 1}`;
          const classCode = cargo.cargoClassCode || "—";
          const qty = cargo.quantity ?? 1;
          const cargoIdx = vehicleCount + idx;
          const amount =
            pricing?.cargoPrices
              ?.filter((c) => c.index === cargoIdx && c.cargoType === "loose" && tripIds.has(c.tripId))
              .reduce((sum, c) => sum + c.baseFare, 0) ?? 0;

          return { label, classCode, quantity: qty, amount };
        })
        .filter((c): c is CargoLine => c !== null);

      // For charges: in round trip, split evenly between legs
      // (charges are totals, not per-trip, so we divide by trip count)
      const tripCount = isRoundTrip ? 2 : 1;
      const splitCharge = (charge: ChargeDetail): ChargeDetail => ({
        ...charge,
        amount: charge.amount / tripCount,
      });

      return {
        tripType,
        tripLabel: label,
        passengers,
        vehicles,
        cargos,
        passengerCharges: categorizedCharges.passenger.map(splitCharge),
        vehicleCharges: categorizedCharges.vehicle.map(splitCharge),
        cargoCharges: categorizedCharges.cargo.map(splitCharge),
      };
    };

    if (!isRoundTrip) {
      // Single trip — one group, no label needed
      return [buildGroup("departure", departureTripIds, "")];
    }

    return [
      buildGroup("departure", departureTripIds, "Departure"),
      buildGroup("return", returnTripIds, "Return"),
    ];
  }, [formData, pricing, allTrips, isRoundTrip, categorizedCharges]);

  // Compute totals
  const grandTotalFromGroups = tripPricingGroups.reduce((total, group) => {
    const paxTotal = group.passengers.reduce((s, l) => s + l.amount, 0);
    const vehTotal = group.vehicles.reduce((s, l) => s + l.amount, 0);
    const crgTotal = group.cargos.reduce((s, l) => s + l.amount, 0);
    const paxCharges = group.passengerCharges.reduce((s, c) => s + c.amount, 0);
    const vehCharges = group.vehicleCharges.reduce((s, c) => s + c.amount, 0);
    const crgCharges = group.cargoCharges.reduce((s, c) => s + c.amount, 0);
    return total + paxTotal + vehTotal + crgTotal + paxCharges + vehCharges + crgCharges;
  }, 0);

  const otherChargesTotal = categorizedCharges.other.reduce((s, c) => s + c.amount, 0);

  const hasItems = tripPricingGroups.some(
    (g) => g.passengers.length > 0 || g.vehicles.length > 0 || g.cargos.length > 0,
  );

  const markupAmount = formData?.ta_markup ?? 0;
  const baseTotal = pricing?.grandTotal ?? (grandTotalFromGroups + otherChargesTotal);
  const grandTotal = baseTotal + markupAmount;
  const netWalletDeduction = commissionAmount > 0 ? Math.max(0, baseTotal - commissionAmount) : baseTotal;

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

            {tripPricingGroups.map((group, groupIdx) => {
              const paxBaseFare = group.passengers.reduce((s, l) => s + l.amount, 0);
              const paxChargesAmt = group.passengerCharges.reduce((s, c) => s + c.amount, 0);
              const paxSubtotal = paxBaseFare + paxChargesAmt;

              const vehBaseFare = group.vehicles.reduce((s, l) => s + l.amount, 0);
              const vehChargesAmt = group.vehicleCharges.reduce((s, c) => s + c.amount, 0);
              const vehSubtotal = vehBaseFare + vehChargesAmt;

              const crgBaseFare = group.cargos.reduce((s, l) => s + l.amount, 0);
              const crgChargesAmt = group.cargoCharges.reduce((s, c) => s + c.amount, 0);
              const crgSubtotal = crgBaseFare + crgChargesAmt;

              return (
                <div key={`group-${groupIdx}`} className="space-y-2">
                  {/* Group label for round trips */}
                  {group.tripLabel && (
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={group.tripType === "departure" ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {group.tripLabel}
                      </Badge>
                    </div>
                  )}

                  {/* Passengers */}
                  {group.passengers.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                        <IconUser className="h-3 w-3" />
                        <span>Passengers</span>
                      </div>
                      {group.passengers.map((line, idx) => (
                        <div
                          key={`pax-${groupIdx}-${idx}`}
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
                      {group.passengerCharges.map((charge, idx) => (
                        <div
                          key={`pax-charge-${groupIdx}-${idx}`}
                          className="flex items-center justify-between text-xs pl-4"
                        >
                          <span className="text-gray-500">{charge.chargeName}</span>
                          <span className="font-medium">{formatCurrency(charge.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium pl-4 text-blue-700">
                        <span>Subtotal</span>
                        <span>{formatCurrency(paxSubtotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Vehicles */}
                  {group.vehicles.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700">
                        <IconCar className="h-3 w-3" />
                        <span>Vehicles</span>
                      </div>
                      {group.vehicles.map((line, idx) => (
                        <div
                          key={`veh-${groupIdx}-${idx}`}
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
                      {group.vehicleCharges.map((charge, idx) => (
                        <div
                          key={`veh-charge-${groupIdx}-${idx}`}
                          className="flex items-center justify-between text-xs pl-4"
                        >
                          <span className="text-gray-500">{charge.chargeName}</span>
                          <span className="font-medium">{formatCurrency(charge.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium pl-4 text-purple-700">
                        <span>Subtotal</span>
                        <span>{formatCurrency(vehSubtotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Cargos */}
                  {group.cargos.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <IconPackage className="h-3 w-3" />
                        <span>Cargo</span>
                      </div>
                      {group.cargos.map((line, idx) => (
                        <div
                          key={`crg-${groupIdx}-${idx}`}
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
                      {group.cargoCharges.map((charge, idx) => (
                        <div
                          key={`crg-charge-${groupIdx}-${idx}`}
                          className="flex items-center justify-between text-xs pl-4"
                        >
                          <span className="text-gray-500">{charge.chargeName}</span>
                          <span className="font-medium">{formatCurrency(charge.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium pl-4 text-amber-700">
                        <span>Subtotal</span>
                        <span>{formatCurrency(crgSubtotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Separator between trip groups */}
                  {isRoundTrip && groupIdx < tripPricingGroups.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              );
            })}

            {/* Per-booking charges & taxes */}
            {categorizedCharges.other.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500">
                  Charges & Taxes
                </div>
                {categorizedCharges.other.map((charge, idx) => (
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

            {/* Commission Discount */}
            {commissionAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">Commission Discount</span>
                <span className="font-medium text-green-600">
                  −{formatCurrency(commissionAmount)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Estimated Total</span>
              <span className="text-sm font-bold text-gray-800">
                {isPricingLoading ? "..." : formatCurrency(grandTotal)}
              </span>
            </div>
            {commissionAmount > 0 && !isPricingLoading && baseTotal > 0 && (
              <div className="flex justify-between items-center bg-green-50 rounded-md px-2 py-1.5 -mx-1">
                <span className="text-xs font-semibold text-green-700">You Pay (Wallet)</span>
                <span className="text-sm font-bold text-green-700">
                  {formatCurrency(netWalletDeduction)}
                </span>
              </div>
            )}
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
