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
import { Label } from "@/components/ui/label";
import { useBulkInvalidate } from "@/hooks/mutations/bookings/use-booking-actions";
import type { BookingView } from "@/constants/types/booking.types";

interface InvalidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  booking: BookingView;
}

export function InvalidateModal({
  open,
  onOpenChange,
  bookingId,
  booking,
}: InvalidateModalProps) {
  const [remarks, setRemarks] = useState("");
  const mutation = useBulkInvalidate(bookingId);

  const allTrips = [
    ...(booking.trips?.departure ?? []),
    ...(booking.trips?.return ?? []),
  ];

  const activePassengers = allTrips.reduce(
    (sum, t) =>
      sum +
      t.passengers.filter(
        (p) =>
          !["invalidated", "removed", "cancelled"].includes(
            (p.bookingStatus ?? p.booking_status ?? "").toLowerCase(),
          ),
      ).length,
    0,
  );

  const activeVehicles = allTrips.reduce(
    (sum, t) =>
      sum +
      t.vehicles.filter(
        (v) =>
          !["invalidated", "removed", "cancelled"].includes(
            (v.bookingStatus ?? v.booking_status ?? "").toLowerCase(),
          ),
      ).length,
    0,
  );

  const activeCargos = allTrips.reduce(
    (sum, t) =>
      sum +
      (t.cargos ?? t.cargo ?? []).filter(
        (c) =>
          !["invalidated", "removed", "cancelled"].includes(
            (c.bookingStatus ?? c.booking_status ?? "").toLowerCase(),
          ),
      ).length,
    0,
  );

  const handleSubmit = () => {
    console.log("[Invalidate] Remarks:", remarks);
    console.log(
      "[Invalidate] Active items — passengers:",
      activePassengers,
      "vehicles:",
      activeVehicles,
      "cargos:",
      activeCargos,
    );

    mutation.mutate(
      { remarks },
      {
        onSuccess: (data) => {
          console.log("[Invalidate] Success:", data);
          setRemarks("");
          onOpenChange(false);
        },
        onError: (err) => {
          console.error("[Invalidate] Error:", err);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invalidate Booking</DialogTitle>
          <DialogDescription>
            Booking {booking.reference_no ?? bookingId.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-destructive font-medium">
            This will invalidate all active passengers ({activePassengers}) and
            vehicles ({activeVehicles})
            {activeCargos > 0 ? ` and cargo items (${activeCargos})` : ""} with
            a 100% refund.
          </p>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks *</Label>
            <Textarea
              id="remarks"
              placeholder="Enter reason for invalidation..."
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
            variant="destructive"
            onClick={handleSubmit}
            disabled={!remarks.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Invalidating…" : "Invalidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
