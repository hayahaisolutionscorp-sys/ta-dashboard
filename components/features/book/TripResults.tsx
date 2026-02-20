"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconShip, IconCheck } from "@tabler/icons-react";
import type { TripView } from "@/lib/types/booking.types";

interface TripResultsProps {
  trips: TripView[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  selectedTripIds: string[];
  onTripSelect: (tripId: string) => void;
}

export default function TripResults({
  trips,
  total,
  isLoading,
  error,
  selectedTripIds,
  onTripSelect,
}: TripResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Searching for trips...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Available Trips</span>
          <Badge variant="secondary">{total} found</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trips.map((trip) => {
          const isSelected = selectedTripIds.includes(trip.id);
          return (
            <button
              type="button"
              key={trip.id}
              onClick={() => onTripSelect(trip.id)}
              className={`w-full flex items-center gap-4 p-4 border rounded-lg transition-all cursor-pointer text-left ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {isSelected ? (
                  <IconCheck className="h-5 w-5" />
                ) : (
                  <IconShip className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {trip.route?.src_port_name || "Origin"} →{" "}
                    {trip.route?.dest_port_name || "Destination"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{trip.ship?.name || "Ship TBD"}</span>
                  <span>•</span>
                  <span>
                    {trip.departure_date
                      ? new Date(trip.departure_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "Date TBD"}
                  </span>
                  {trip.departure_time && (
                    <>
                      <span>•</span>
                      <span>{trip.departure_time}</span>
                    </>
                  )}
                </div>
              </div>

              {trip.status && (
                <Badge
                  variant={trip.status === "active" ? "default" : "secondary"}
                >
                  {trip.status}
                </Badge>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
