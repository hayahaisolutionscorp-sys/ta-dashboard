"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import type { PreparedBookingData } from "@/lib/types/booking.types";
import {
  IconUser,
  IconCar,
  IconPackage,
  IconMail,
  IconPhone,
  IconMapPin,
} from "@tabler/icons-react";

interface BookingConfirmProps {
  formData: BookingFormData;
  bookingData: PreparedBookingData;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export default function BookingConfirm({
  formData,
  bookingData,
  onBack,
  onConfirm,
  isPending,
}: BookingConfirmProps) {
  const formatDate = (date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const departures = Array.isArray(bookingData.departure)
    ? bookingData.departure
    : bookingData.departure
      ? [bookingData.departure]
      : [];

  const returns = Array.isArray(bookingData.return)
    ? bookingData.return
    : bookingData.return
      ? [bookingData.return]
      : [];

  return (
    <div className="space-y-4">
      {/* Trip Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Trip Summary</h3>
          <div className="space-y-2">
            {departures.map((trip, idx) => (
              <div
                key={`dep-${idx}`}
                className="flex items-center gap-2 text-sm"
              >
                <Badge variant="secondary" className="text-xs">
                  Departure
                </Badge>
                <span>
                  {trip.route?.src_port_name ?? "Origin"} →{" "}
                  {trip.route?.dest_port_name ?? "Destination"}
                </span>
              </div>
            ))}
            {returns.map((trip, idx) => (
              <div
                key={`ret-${idx}`}
                className="flex items-center gap-2 text-sm"
              >
                <Badge variant="outline" className="text-xs">
                  Return
                </Badge>
                <span>
                  {trip.route?.src_port_name ?? "Origin"} →{" "}
                  {trip.route?.dest_port_name ?? "Destination"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Booking Type: {formData.bookingType}
          </div>
        </CardContent>
      </Card>

      {/* Passengers */}
      {formData.passengers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconUser className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold">
                Passengers ({formData.passengers.length})
              </h3>
            </div>
            <div className="divide-y">
              {formData.passengers.map((passenger, idx) => (
                <div key={`p-${idx}`} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {passenger.firstName} {passenger.lastName}
                    </span>
                    <div className="flex gap-1">
                      {passenger.tripAssignments.map((ta, tidx) => (
                        <Badge
                          key={`ta-${tidx}`}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {ta.discountType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {passenger.sex === "male" ? "Male" : "Female"} ·{" "}
                    {formatDate(passenger.birthday)} · {passenger.nationality}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicles */}
      {formData.vehicles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconCar className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold">
                Vehicles ({formData.vehicles.length})
              </h3>
            </div>
            <div className="divide-y">
              {formData.vehicles.map((vehicle, idx) => (
                <div key={`v-${idx}`} className="py-2 first:pt-0 last:pb-0">
                  <div className="text-sm font-medium">
                    {vehicle.plateNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.make} {vehicle.modelName}{" "}
                    {vehicle.modelYear ? `(${vehicle.modelYear})` : ""} ·
                    Driver: Passenger #{Number(vehicle.driverId) + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loose Cargos */}
      {formData.looseCargos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconPackage className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold">
                Cargo ({formData.looseCargos.length})
              </h3>
            </div>
            <div className="divide-y">
              {formData.looseCargos.map((cargo, idx) => (
                <div key={`c-${idx}`} className="py-2 first:pt-0 last:pb-0">
                  <div className="text-sm font-medium">{cargo.description}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty: {cargo.quantity}
                    {cargo.weight ? ` · ${cargo.weight}kg` : ""}
                    {cargo.cargoClassCode ? ` · ${cargo.cargoClassCode}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Contact Details</h3>
          <div className="space-y-1 text-sm">
            {formData.contactAddress && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconMapPin className="h-3.5 w-3.5" />
                <span>{formData.contactAddress}</span>
              </div>
            )}
            {formData.contactMobileNumber && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconPhone className="h-3.5 w-3.5" />
                <span>{formData.contactMobileNumber}</span>
              </div>
            )}
            {formData.contactEmail && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconMail className="h-3.5 w-3.5" />
                <span>{formData.contactEmail}</span>
              </div>
            )}
          </div>
          {formData.remarks && (
            <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
              <span className="font-medium">Remarks:</span> {formData.remarks}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          Back to Edit
        </Button>
        <Button type="button" onClick={onConfirm} disabled={isPending}>
          {isPending ? "Creating Booking..." : "Confirm & Create Booking"}
        </Button>
      </div>
    </div>
  );
}
