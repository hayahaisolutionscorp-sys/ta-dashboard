"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PreparedBookingData } from "@/lib/types/booking.types";
import { IconShip, IconCalendar, IconRoute } from "@tabler/icons-react";

interface TripInfo {
  id?: string;
  tripId?: string;
  tripType: "departure" | "return";
  sequence: number;
  cabins?: Array<{ id: number; name: string }>;
  ship?: { name?: string; cabins?: Array<{ id: number; name: string }> };
  route?: {
    srcPort?: { name?: string };
    destPort?: { name?: string };
  };
  departureDate?: string;
  status?: string;
}

interface TripSummaryPanelProps {
  bookingData: PreparedBookingData;
  allTrips: TripInfo[];
}

export default function TripSummaryPanel({
  bookingData,
  allTrips,
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

  const departureTrips = allTrips.filter((t) => t.tripType === "departure");
  const returnTrips = allTrips.filter((t) => t.tripType === "return");

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

      {/* Rates info */}
      {bookingData.rates && bookingData.rates.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">
              {bookingData.rates.length} rate snapshot(s) loaded
            </p>
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
  trip: TripInfo;
  formatDateTime: (dateStr?: string) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconRoute className="h-3 w-3" />
        <span>
          {trip.route?.srcPort?.name ?? "—"} →{" "}
          {trip.route?.destPort?.name ?? "—"}
        </span>
      </div>
      {trip.ship?.name && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconShip className="h-3 w-3" />
          <span>{trip.ship.name}</span>
        </div>
      )}
      {trip.departureDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconCalendar className="h-3 w-3" />
          <span>{formatDateTime(trip.departureDate)}</span>
        </div>
      )}
      {trip.cabins && trip.cabins.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {trip.cabins.map((cabin) => (
            <Badge
              key={cabin.id}
              variant="outline"
              className="text-[10px] py-0"
            >
              {cabin.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
