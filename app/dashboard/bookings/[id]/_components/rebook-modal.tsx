"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowLeft } from "@tabler/icons-react";
import { useBulkRebook } from "@/hooks/mutations/bookings/use-booking-actions";
import { useAvailableDates } from "@/hooks/queries/bookings/use-available-dates";
import { useAvailableTrips } from "@/hooks/queries/bookings/use-available-trips";
import { useAuthStore } from "@/lib/stores/auth.store";
import type {
  BookingView,
  BookingTripDetail,
  BookingTripPassengerView,
  TripView,
  AvailableTripsQuery,
} from "@/constants/types/booking.types";

interface RebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  booking: BookingView;
}

const INACTIVE_STATUSES = ["invalidated", "removed", "cancelled"];

function isActive(status?: string) {
  return !INACTIVE_STATUSES.includes((status ?? "").toLowerCase());
}

function formatCurrency(amount?: number | string | null) {
  const n = Number(amount ?? 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RebookModal({
  open,
  onOpenChange,
  bookingId,
  booking,
}: RebookModalProps) {
  const [step, setStep] = useState<"select" | "trip">("select");
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const mutation = useBulkRebook(bookingId);
  const user = useAuthStore((s) => s.user);

  // Parse origin/destination codes from route_summary (format: "XXX-YYY")
  const [originCode, destCode] = useMemo(() => {
    const summary = booking.route_summary ?? "";
    const parts = summary.split(", ")[0]?.split("-") ?? [];
    if (parts.length >= 2) return [parts[0], parts[1]];
    return ["", ""];
  }, [booking.route_summary]);

  const allTrips: BookingTripDetail[] = [
    ...(booking.trips?.departure ?? []),
    ...(booking.trips?.return ?? []),
  ];

  // Collect all active passengers with their details for reconstructing the booking
  const activePassengerMap = useMemo(() => {
    const map = new Map<string, BookingTripPassengerView>();
    for (const trip of allTrips) {
      for (const p of trip.passengers) {
        if (isActive(p.bookingStatus ?? p.booking_status)) {
          const id = p.booking_trip_passenger_id ?? p.bookingTripPassengerId;
          map.set(id, p);
        }
      }
    }
    return map;
  }, [allTrips]);

  // Available dates query
  const {
    data: availableDates,
    isLoading: datesLoading,
  } = useAvailableDates(
    step === "trip" ? originCode : "",
    step === "trip" ? destCode : "",
  );

  // Available trips query
  const tripQuery: AvailableTripsQuery | null = useMemo(() => {
    if (!selectedDate || !originCode || !destCode) return null;
    return {
      origin_code: originCode,
      destination_code: destCode,
      departure_date: selectedDate,
      passenger_count: selectedPassengerIds.size || 1,
      vehicle_count: 0,
    };
  }, [originCode, destCode, selectedDate, selectedPassengerIds.size]);

  const {
    data: tripsResult,
    isLoading: tripsLoading,
  } = useAvailableTrips(tripQuery, step === "trip" && !!selectedDate);

  const availableTrips = tripsResult?.data ?? [];

  const togglePassenger = (id: string) => {
    setSelectedPassengerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    setStep("trip");
    setSelectedDate(null);
    setSelectedTripId(null);
  };

  const handleBack = () => {
    setStep("select");
    setSelectedDate(null);
    setSelectedTripId(null);
  };

  const handleSubmit = () => {
    if (!selectedTripId) return;

    // Reconstruct passengers from old booking data
    const passengers = Array.from(selectedPassengerIds).map((id) => {
      const p = activePassengerMap.get(id);
      return {
        firstName: p?.firstName ?? p?.first_name ?? "",
        lastName: p?.lastName ?? p?.last_name ?? "",
        sex: (p?.sex ?? "male").toLowerCase(),
        birthday: p?.birthday ?? "",
        address: "",
        nationality: p?.nationality ?? "Filipino",
        mobileNumber: p?.mobileNumber ?? p?.mobile_number ?? "",
        email: p?.email ?? "",
        tripAssignments: [
          {
            tripId: selectedTripId,
            discountType: p?.discountType ?? p?.discount_type ?? "Adult",
          },
        ],
      };
    });

    mutation.mutate(
      {
        passengerIds: Array.from(selectedPassengerIds),
        newBookingData: {
          bookingSource: "travel_agency",
          bookingType: "Single",
          trips: [
            { tripType: "departure", sequence: 1, tripId: selectedTripId },
          ],
          passengers,
          vehicles: [],
          consignee: `${passengers[0]?.firstName ?? ""} ${passengers[0]?.lastName ?? ""}`.trim(),
          payment_method: "WALLET",
          globalUserId: user?.id,
          agencyId: user?.travel_agency_id,
        },
      },
      {
        onSuccess: () => {
          resetAndClose();
        },
      },
    );
  };

  const resetAndClose = () => {
    setStep("select");
    setSelectedPassengerIds(new Set());
    setSelectedDate(null);
    setSelectedTripId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Select Passengers to Rebook" : "Select New Trip"}
          </DialogTitle>
          <DialogDescription>
            Booking {booking.reference_no ?? bookingId.slice(0, 8)}
            {originCode && destCode ? ` • ${originCode}-${destCode}` : ""}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {allTrips.map((trip, i) => {
              const activePassengers = trip.passengers.filter((p) =>
                isActive(p.bookingStatus ?? p.booking_status),
              );

              if (activePassengers.length === 0) return null;

              return (
                <div key={trip.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    {trip.origin} → {trip.destination}
                    {allTrips.length > 1 ? ` (Leg ${i + 1})` : ""}
                  </p>
                  <div className="space-y-1 pl-2">
                    {activePassengers.map((p) => {
                      const id =
                        p.booking_trip_passenger_id ??
                        p.bookingTripPassengerId;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedPassengerIds.has(id)}
                            onCheckedChange={() => togglePassenger(id)}
                          />
                          <span className="flex-1">
                            {p.name ?? `${p.first_name ?? p.firstName} ${p.last_name ?? p.lastName}`}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {p.discountType ?? p.discount_type}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(p.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {i < allTrips.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        )}

        {step === "trip" && (
          <div className="space-y-4">
            {/* Date selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Dates</p>
              {datesLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-20 rounded-md" />
                  ))}
                </div>
              ) : !availableDates?.length ? (
                <p className="text-sm text-muted-foreground">
                  No available dates found for this route.
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {availableDates.map((d) => (
                    <Button
                      key={d.date}
                      variant={selectedDate === d.date ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedDate(d.date);
                        setSelectedTripId(null);
                      }}
                    >
                      {formatDate(d.date)}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {d.trip_count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Trip selection */}
            {selectedDate && (
              <div className="space-y-2">
                <Separator />
                <p className="text-sm font-medium">Available Trips</p>
                {tripsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                  </div>
                ) : !availableTrips.length ? (
                  <p className="text-sm text-muted-foreground">
                    No trips available on this date.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableTrips.map((trip: TripView) => (
                      <button
                        key={trip.id}
                        type="button"
                        className={`w-full text-left border rounded-lg p-3 transition-colors ${
                          selectedTripId === trip.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedTripId(trip.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {trip.segments?.[0]?.ship_name ?? "Ship"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(trip.total_departure_time)} →{" "}
                              {formatTime(trip.total_arrival_time)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {trip.origin_name} → {trip.destination_name}
                            </p>
                            {trip.segments?.[0]?.base_fare != null && (
                              <p className="text-sm font-medium">
                                {formatCurrency(trip.segments[0].base_fare)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "select" ? (
            <>
              <Button variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedPassengerIds.size === 0}
              >
                Next — Select Trip
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack}>
                <IconArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedTripId || mutation.isPending}
              >
                {mutation.isPending ? "Rebooking…" : "Confirm Rebook"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
