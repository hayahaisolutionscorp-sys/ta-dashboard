"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconShip, IconCheck } from "@tabler/icons-react";
import type { TripView } from "@/constants/types/booking.types";

interface TripResultsProps {
  trips: TripView[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  selectedTripIds: string[];
  onTripSelect: (tripId: string) => void;
  title?: string;
}

export default function TripResults({
  trips,
  total,
  isLoading,
  error,
  selectedTripIds,
  onTripSelect,
  title = "Available Trips",
}: TripResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            Searching for trips...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4 border rounded-lg"
            >
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-3/4 sm:w-48" />
                <Skeleton className="h-3 w-1/2 sm:w-32" />
              </div>
              <Skeleton className="h-8 w-16 sm:w-20 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600 font-medium">Error searching trips</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <IconShip className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <p className="font-medium text-lg">No trips found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria or selecting a different date.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span>{title}</span>
          <Badge variant="secondary">{total} found</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {trips.map((trip) => {
          const isSelected = selectedTripIds.includes(trip.id);
          const firstSegment = trip.segments?.[0];
          const shipName = firstSegment?.ship_name ?? "Ship TBD";
          const departureTime = trip.total_departure_time
            ? new Date(trip.total_departure_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;
          const arrivalTime = trip.total_arrival_time
            ? new Date(trip.total_arrival_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;
          const departureDate = trip.total_departure_time
            ? new Date(trip.total_departure_time).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "Date TBD";
          const durationHrs = Math.floor(
            (trip.total_duration_minutes ?? 0) / 60,
          );
          const durationMins = (trip.total_duration_minutes ?? 0) % 60;
          const baseFare = firstSegment?.base_fare;
          const currency = firstSegment?.currency ?? "PHP";

          return (
            <button
              type="button"
              key={trip.id}
              onClick={() => onTripSelect(trip.id)}
              className={`w-full p-3 sm:p-4 border rounded-lg transition-all cursor-pointer text-left ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {/* Mobile: stacked layout / Desktop: row layout */}
              <div className="flex gap-3 sm:items-center sm:gap-4">
                <div
                  className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 mt-0.5 sm:mt-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isSelected ? (
                    <IconCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <IconShip className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base">
                      {trip.origin_name} → {trip.destination_name}
                    </span>
                    {trip.type === "connecting" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs"
                      >
                        {trip.segment_count} stops
                      </Badge>
                    )}
                  </div>

                  {/* Meta row — wraps naturally on small screens */}
                  <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                    <span className="truncate max-w-30 sm:max-w-none">
                      {shipName}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{departureDate}</span>
                    {departureTime && arrivalTime && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          {departureTime} → {arrivalTime}
                        </span>
                      </>
                    )}
                    {(durationHrs > 0 || durationMins > 0) && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          {durationHrs > 0 ? `${durationHrs}h ` : ""}
                          {durationMins > 0 ? `${durationMins}m` : ""}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Fare — inline on mobile below meta, right-aligned on desktop */}
                  {baseFare != null && (
                    <div className="mt-2 sm:hidden">
                      <span className="font-semibold text-sm">
                        {currency} {baseFare.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        per adult
                      </span>
                    </div>
                  )}
                </div>

                {/* Fare — desktop only, right column */}
                {baseFare != null && (
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="font-semibold text-sm">
                      {currency} {baseFare.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per adult
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
