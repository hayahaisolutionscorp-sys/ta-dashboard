"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconShip,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconArrowRight,
  IconArrowsExchange,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailableTrips } from "@/hooks/queries/bookings/use-available-trips";
import type { AvailableTripsQuery } from "@/lib/types/booking.types";
import TripResults from "@/components/features/book/TripResults";

export default function BookTripPage() {
  const router = useRouter();
  const [originCode, setOriginCode] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  const query: AvailableTripsQuery | null =
    hasSearched && originCode && destinationCode && departureDate
      ? {
          origin_code: originCode.toUpperCase(),
          destination_code: destinationCode.toUpperCase(),
          departure_date: departureDate,
          passenger_count: passengerCount,
        }
      : null;

  const {
    data: tripsData,
    isLoading,
    error,
  } = useAvailableTrips(query, hasSearched);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (originCode && destinationCode && departureDate) {
      setHasSearched(true);
      setSelectedTripIds([]);
    }
  };

  const handleSwapPorts = () => {
    const temp = originCode;
    setOriginCode(destinationCode);
    setDestinationCode(temp);
    if (hasSearched) {
      setHasSearched(false);
      setSelectedTripIds([]);
    }
  };

  const handleTripSelect = (tripId: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId)
        ? prev.filter((id) => id !== tripId)
        : [...prev, tripId],
    );
  };

  const handleContinue = () => {
    if (selectedTripIds.length === 0) return;
    const params = new URLSearchParams();
    params.set("departure", selectedTripIds.join(","));
    router.push(`/dashboard/book/create?${params.toString()}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book a Trip</h1>
          <p className="text-muted-foreground">
            Search and book ferry trips for your customers
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShip className="h-5 w-5" />
              Trip Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
                {/* Origin */}
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin Port Code</Label>
                  <div className="relative">
                    <IconMapPin className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="origin"
                      placeholder="e.g. CEB"
                      className="pl-9 uppercase"
                      value={originCode}
                      onChange={(e) => setOriginCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex items-end justify-center lg:justify-start pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleSwapPorts}
                    className="rounded-full"
                  >
                    <IconArrowsExchange className="h-4 w-4" />
                  </Button>
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Port Code</Label>
                  <div className="relative">
                    <IconMapPin className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="destination"
                      placeholder="e.g. TAG"
                      className="pl-9 uppercase"
                      value={destinationCode}
                      onChange={(e) => setDestinationCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Travel Date</Label>
                  <div className="relative">
                    <IconCalendar className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-9"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Passengers */}
                <div className="space-y-2">
                  <Label htmlFor="passengers">Passengers</Label>
                  <div className="relative">
                    <IconUsers className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="passengers"
                      type="number"
                      className="pl-9"
                      min={1}
                      value={passengerCount}
                      onChange={(e) =>
                        setPassengerCount(Number(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={!originCode || !destinationCode || !departureDate}
                >
                  Search Trips
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Trip Results */}
        {hasSearched && (
          <TripResults
            trips={tripsData?.data || []}
            total={tripsData?.total || 0}
            isLoading={isLoading}
            error={error}
            selectedTripIds={selectedTripIds}
            onTripSelect={handleTripSelect}
          />
        )}

        {/* Continue Button */}
        {selectedTripIds.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={handleContinue} size="lg">
              Continue to Booking
              <IconArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
