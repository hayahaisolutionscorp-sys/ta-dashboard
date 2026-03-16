"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useBulkRefund } from "@/hooks/mutations/bookings/use-booking-actions";
import type {
  BookingView,
  BookingTripDetail,
} from "@/constants/types/booking.types";

interface RefundModalProps {
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

export function RefundModal({
  open,
  onOpenChange,
  bookingId,
  booking,
}: RefundModalProps) {
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCargoIds, setSelectedCargoIds] = useState<Set<string>>(
    new Set(),
  );
  const [remarks, setRemarks] = useState("");
  const [reasonType, setReasonType] = useState("");
  const mutation = useBulkRefund(bookingId);

  const allTrips: BookingTripDetail[] = [
    ...(booking.trips?.departure ?? []),
    ...(booking.trips?.return ?? []),
  ];

  const togglePassenger = (id: string) => {
    setSelectedPassengerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCargo = (id: string) => {
    setSelectedCargoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    const payload = {
      selectedPassengerIds: Array.from(selectedPassengerIds),
      selectedVehicleIds: Array.from(selectedVehicleIds),
      selectedCargoIds: Array.from(selectedCargoIds),
      remarks,
      reasonType: reasonType || undefined,
    };

    console.log("[Refund] Selected passengers:", payload.selectedPassengerIds);
    console.log("[Refund] Selected vehicles:", payload.selectedVehicleIds);
    console.log("[Refund] Selected cargos:", payload.selectedCargoIds);
    console.log("[Refund] Payload:", payload);

    mutation.mutate(payload, {
      onSuccess: (data) => {
        console.log("[Refund] Success:", data);
        setSelectedPassengerIds(new Set());
        setSelectedVehicleIds(new Set());
        setSelectedCargoIds(new Set());
        setRemarks("");
        setReasonType("");
        onOpenChange(false);
      },
      onError: (err) => {
        console.error("[Refund] Error:", err);
      },
    });
  };

  const totalSelected =
    selectedPassengerIds.size + selectedVehicleIds.size + selectedCargoIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refund Booking</DialogTitle>
          <DialogDescription>
            Booking {booking.reference_no ?? bookingId.slice(0, 8)} — select
            passengers, vehicles, and cargo to refund
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {allTrips.map((trip, i) => {
            const activePassengers = trip.passengers.filter((p) =>
              isActive(p.bookingStatus ?? p.booking_status),
            );
            const activeVehicles = trip.vehicles.filter((v) =>
              isActive(v.bookingStatus ?? v.booking_status),
            );
            const activeCargos = (trip.cargos ?? trip.cargo ?? []).filter((c) =>
              isActive(c.bookingStatus ?? c.booking_status),
            );

            if (
              activePassengers.length === 0 &&
              activeVehicles.length === 0 &&
              activeCargos.length === 0
            ) {
              return null;
            }

            return (
              <div key={trip.id} className="space-y-2">
                <p className="text-sm font-medium">
                  {trip.origin} → {trip.destination}
                  {allTrips.length > 1 ? ` (Leg ${i + 1})` : ""}
                </p>

                {activePassengers.length > 0 && (
                  <div className="space-y-1 pl-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Passengers
                    </p>
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
                )}

                {activeVehicles.length > 0 && (
                  <div className="space-y-1 pl-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Vehicles
                    </p>
                    {activeVehicles.map((v) => {
                      const id =
                        v.booking_trip_cargo_id ?? v.bookingTripCargoId;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedVehicleIds.has(id)}
                            onCheckedChange={() => toggleVehicle(id)}
                          />
                          <span className="flex-1">
                            {v.plate_number ?? v.plateNumber}
                            {v.make ? ` — ${v.make} ${v.model ?? ""}` : ""}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(v.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {activeCargos.length > 0 && (
                  <div className="space-y-1 pl-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Cargo
                    </p>
                    {activeCargos.map((c) => {
                      const id =
                        c.booking_trip_cargo_id ?? c.bookingTripCargoId;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedCargoIds.has(id)}
                            onCheckedChange={() => toggleCargo(id)}
                          />
                          <span className="flex-1">
                            {c.description}
                            {c.cargo_type ? ` (${c.cargo_type})` : ""}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {c.quantity > 1 ? `×${c.quantity}` : ""}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(c.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {i < allTrips.length - 1 && <Separator />}
              </div>
            );
          })}

          <Separator />

          <p className="text-sm font-medium">
            {totalSelected} item{totalSelected !== 1 ? "s" : ""} selected
          </p>

          <div className="space-y-2">
            <Label htmlFor="reasonType">Reason Type</Label>
            <Input
              id="reasonType"
              placeholder="e.g. Standard Cancellation"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks *</Label>
            <Textarea
              id="remarks"
              placeholder="Enter reason for refund..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              totalSelected === 0 || !remarks.trim() || mutation.isPending
            }
          >
            {mutation.isPending ? "Processing…" : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
