"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconUsers,
  IconArrowRight,
  IconCar,
  IconShip,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAvailableTrips } from "@/hooks/queries/bookings/use-available-trips";
import { useAvailableDates } from "@/hooks/queries/bookings/use-available-dates";
import { useRoutes } from "@/hooks/queries/bookings/use-routes";
import type { AvailableTripsQuery } from "@/constants/types/booking.types";
import TripResults from "@/components/features/book/TripResults";
import AvailableDates from "@/components/features/book/AvailableDates";
import { PortCombobox } from "@/components/features/book/PortCombobox";
import {
  useBookSearchStore,
  selectIsRoundTrip,
  selectCanContinue,
} from "@/lib/stores/book-search.store";

export default function BookTripPage() {
  const router = useRouter();

  // Store state + actions
  const tripType = useBookSearchStore((s) => s.tripType);
  const originCode = useBookSearchStore((s) => s.originCode);
  const destinationCode = useBookSearchStore((s) => s.destinationCode);
  const departureDate = useBookSearchStore((s) => s.departureDate);
  const passengerCount = useBookSearchStore((s) => s.passengerCount);
  const vehicleCount = useBookSearchStore((s) => s.vehicleCount);
  const hasSearched = useBookSearchStore((s) => s.hasSearched);
  const selectedTripIds = useBookSearchStore((s) => s.selectedTripIds);
  const returnDate = useBookSearchStore((s) => s.returnDate);
  const hasSearchedReturn = useBookSearchStore((s) => s.hasSearchedReturn);
  const selectedReturnTripIds = useBookSearchStore(
    (s) => s.selectedReturnTripIds,
  );
  const isRoundTrip = useBookSearchStore(selectIsRoundTrip);
  const canContinue = useBookSearchStore(selectCanContinue);

  const {
    setTripType,
    setOriginCode,
    setDestinationCode,
    setDepartureDate,
    setReturnDate,
    incrementPassengers,
    decrementPassengers,
    incrementVehicles,
    decrementVehicles,
    search,
    selectTrip,
    selectReturnTrip,
    handleDateSelect,
    handleReturnDateSelect,
    reset,
  } = useBookSearchStore();

  // Reset store on unmount so navigating back starts fresh
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Fetch routes for the current user's travel agency
  const { data: routes, isLoading: routesLoading } = useRoutes();

  // Build unique origin port options from routes
  const originOptions = useMemo(() => {
    if (!routes) return [];
    const seen = new Set<string>();
    return routes
      .filter((r) => {
        if (seen.has(r.src_port_code)) return false;
        seen.add(r.src_port_code);
        return true;
      })
      .map((r) => ({
        portName: r.src_port_name,
        portCode: r.src_port_code,
      }));
  }, [routes]);

  // Build destination options filtered by the selected origin
  const destinationOptions = useMemo(() => {
    if (!routes || !originCode) return [];
    const seen = new Set<string>();
    return routes
      .filter((r) => r.src_port_code === originCode)
      .filter((r) => {
        if (seen.has(r.dest_port_code)) return false;
        seen.add(r.dest_port_code);
        return true;
      })
      .map((r) => ({
        portName: r.dest_port_name,
        portCode: r.dest_port_code,
      }));
  }, [routes, originCode]);

  // Fetch available dates for departure (origin → destination)
  const { data: availableDates, isLoading: datesLoading } = useAvailableDates(
    originCode.toUpperCase(),
    destinationCode.toUpperCase(),
  );

  // Fetch available dates for return (destination → origin, swapped)
  const { data: returnAvailableDates, isLoading: returnDatesLoading } =
    useAvailableDates(
      destinationCode.toUpperCase(),
      originCode.toUpperCase(),
    );

  // Departure trips query
  const query: AvailableTripsQuery | null =
    hasSearched && originCode && destinationCode && departureDate
      ? {
          origin_code: originCode.toUpperCase(),
          destination_code: destinationCode.toUpperCase(),
          departure_date: departureDate,
          passenger_count: passengerCount,
          vehicle_count: vehicleCount,
        }
      : null;

  const {
    data: tripsData,
    isLoading,
    error,
  } = useAvailableTrips(query, hasSearched);

  // Return trips query (swapped origin/destination)
  const returnQuery: AvailableTripsQuery | null =
    hasSearchedReturn && originCode && destinationCode && returnDate
      ? {
          origin_code: destinationCode.toUpperCase(),
          destination_code: originCode.toUpperCase(),
          departure_date: returnDate,
          passenger_count: passengerCount,
          vehicle_count: vehicleCount,
        }
      : null;

  const {
    data: returnTripsData,
    isLoading: returnLoading,
    error: returnError,
  } = useAvailableTrips(returnQuery, hasSearchedReturn);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const handleContinue = () => {
    if (!canContinue) return;
    const params = new URLSearchParams();
    params.set("departure", selectedTripIds.join(","));
    if (isRoundTrip && selectedReturnTripIds.length > 0) {
      params.set("return", selectedReturnTripIds.join(","));
    }
    router.push(`/dashboard/book/create?${params.toString()}`);
  };

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:gap-6 md:p-6">
        {/* Search Form */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconShip className="h-5 w-5" />
              Trip Search
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
              {/* Trip Type */}
              <div className="flex items-center gap-4 sm:gap-6">
                <span className="text-sm font-medium">Trip Type</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      tripType === "one-way"
                        ? "border-blue-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {tripType === "one-way" && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={tripType === "one-way"}
                    onChange={() => setTripType("one-way")}
                  />
                  <span className="text-sm">One Way</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      tripType === "round-trip"
                        ? "border-blue-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {tripType === "round-trip" && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={tripType === "round-trip"}
                    onChange={() => setTripType("round-trip")}
                  />
                  <span className="text-sm">Round Trip</span>
                </label>
              </div>

              {/* Port + Date — stacks on mobile, expands on md+ */}
              <div
                className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
                  isRoundTrip ? "md:grid-cols-4" : "md:grid-cols-3"
                } sm:gap-4`}
              >
                {/* From */}
                <div className="space-y-1">
                  <Label
                    htmlFor="origin"
                    className="text-xs text-muted-foreground"
                  >
                    From
                  </Label>
                  <PortCombobox
                    id="origin"
                    options={originOptions}
                    value={originCode}
                    onSelect={setOriginCode}
                    placeholder="Origin port"
                    disabled={routesLoading}
                  />
                </div>

                {/* To */}
                <div className="space-y-1">
                  <Label
                    htmlFor="destination"
                    className="text-xs text-muted-foreground"
                  >
                    To
                  </Label>
                  <PortCombobox
                    id="destination"
                    options={destinationOptions}
                    value={destinationCode}
                    onSelect={setDestinationCode}
                    placeholder="Destination port"
                    disabled={!originCode || routesLoading}
                  />
                </div>

                {/* Departure Date */}
                <div
                  className={`space-y-1 ${!isRoundTrip ? "sm:col-span-2 md:col-span-1" : ""}`}
                >
                  <Label
                    htmlFor="date"
                    className="text-xs text-muted-foreground"
                  >
                    Departure
                  </Label>
                  <input
                    id="date"
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                </div>

                {/* Return Date — only when round-trip */}
                {isRoundTrip && (
                  <div className="space-y-1">
                    <Label
                      htmlFor="return-date"
                      className="text-xs text-muted-foreground"
                    >
                      Return
                    </Label>
                    <input
                      id="return-date"
                      type="date"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={returnDate}
                      min={departureDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Passengers + Vehicles — stacks on mobile */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-8">
                {/* Passengers */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm font-medium">
                    Passengers:
                  </span>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-lg leading-none"
                    onClick={decrementPassengers}
                  >
                    -
                  </button>
                  <div className="flex items-center gap-1.5 border rounded px-2 sm:px-3 py-1 min-w-10 sm:min-w-14 justify-center">
                    <IconUsers className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {passengerCount}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-lg leading-none"
                    onClick={incrementPassengers}
                  >
                    +
                  </button>
                </div>

                {/* Vehicles */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm font-medium">
                    Vehicles:
                  </span>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-lg leading-none"
                    onClick={decrementVehicles}
                  >
                    -
                  </button>
                  <div className="flex items-center gap-1.5 border rounded px-2 sm:px-3 py-1 min-w-10 sm:min-w-14 justify-center">
                    <IconCar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{vehicleCount}</span>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-lg leading-none"
                    onClick={incrementVehicles}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Search Button — full width on mobile */}
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto sm:ml-auto sm:flex bg-blue-500 hover:bg-blue-600 text-white px-8"
                disabled={
                  !originCode ||
                  !destinationCode ||
                  !departureDate ||
                  (isRoundTrip && !returnDate)
                }
              >
                Search Trips
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Departure Available Dates */}
        {originCode && destinationCode && (
          <AvailableDates
            title={isRoundTrip ? "Departure Dates" : "Available Dates"}
            dates={availableDates ?? []}
            isLoading={datesLoading}
            selectedDate={departureDate}
            onDateSelect={handleDateSelect}
          />
        )}

        {/* Return Available Dates — only when round-trip */}
        {isRoundTrip && originCode && destinationCode && (
          <AvailableDates
            title="Return Dates"
            dates={returnAvailableDates ?? []}
            isLoading={returnDatesLoading}
            selectedDate={returnDate}
            onDateSelect={handleReturnDateSelect}
          />
        )}

        {/* Departure Trip Results */}
        {hasSearched && (
          <TripResults
            title={isRoundTrip ? "Departure Trips" : "Available Trips"}
            trips={tripsData?.data || []}
            total={tripsData?.total || 0}
            isLoading={isLoading}
            error={error}
            selectedTripIds={selectedTripIds}
            onTripSelect={selectTrip}
          />
        )}

        {/* Return Trip Results — only when round-trip */}
        {isRoundTrip && hasSearchedReturn && (
          <TripResults
            title="Return Trips"
            trips={returnTripsData?.data || []}
            total={returnTripsData?.total || 0}
            isLoading={returnLoading}
            error={returnError}
            selectedTripIds={selectedReturnTripIds}
            onTripSelect={selectReturnTrip}
          />
        )}

        {/* Continue Button — full width on mobile, sticky at bottom */}
        {canContinue && (
          <div className="sticky bottom-3 sm:static sm:flex sm:justify-end">
            <Button
              onClick={handleContinue}
              size="lg"
              className="w-full sm:w-auto"
            >
              Continue to Booking
              <IconArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
