"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconArrowLeft,
  IconTicket,
  IconUsers,
  IconCar,
  IconPackage,
  IconCreditCard,
  IconShip,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
  IconPrinter,
  IconRefresh,
  IconCash,
  IconBan,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBooking } from "@/hooks/queries/bookings/use-booking";
import { InvalidateModal, RefundModal, RebookModal } from "./_components";
import type {
  BookingTripDetail,
  BookingTripPassengerView,
  BookingTripVehicleView,
  BookingTripCargoView,
  BookingPaymentView,
} from "@/constants/types/booking.types";

// ─── Helpers ───────────────────────────────────────────────

function statusVariant(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "completed" || s === "checked-in")
    return "default" as const;
  if (s === "pending") return "secondary" as const;
  if (
    s === "cancelled" ||
    s === "failed" ||
    s === "invalidated" ||
    s === "removed"
  )
    return "destructive" as const;
  return "outline" as const;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString?: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "—";
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

function formatCurrency(amount?: string | number | null) {
  const n = Number(amount ?? 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Sub-components ────────────────────────────────────────

function TripCard({ trip, label }: { trip: BookingTripDetail; label: string }) {
  const activePassengers = trip.passengers.filter(
    (p) =>
      !["invalidated", "removed", "cancelled"].includes(
        (p.bookingStatus ?? p.checkInStatus ?? "").toLowerCase(),
      ),
  );
  const activeVehicles = trip.vehicles.filter(
    (v) =>
      !["invalidated", "removed", "cancelled"].includes(
        (v.bookingStatus ?? v.checkInStatus ?? "").toLowerCase(),
      ),
  );
  const activeCargos = (trip.cargos ?? trip.cargo ?? []).filter(
    (c) =>
      !["invalidated", "removed", "cancelled"].includes(
        (c.bookingStatus ?? c.checkInStatus ?? "").toLowerCase(),
      ),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconShip className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">
              {label} — {trip.ship_name}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Leg {trip.sequence}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconMapPin className="h-4 w-4" />
            {trip.origin} → {trip.destination}
          </span>
          <span className="flex items-center gap-1">
            <IconCalendar className="h-4 w-4" />
            {formatDate(trip.departure)}
          </span>
          <span className="flex items-center gap-1">
            <IconClock className="h-4 w-4" />
            {formatTime(trip.departure)} – {formatTime(trip.arrival)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Passengers */}
        {trip.passengers.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <IconUsers className="h-4 w-4" />
              Passengers ({activePassengers.length})
            </h4>
            <div className="rounded-md border">
              <div className="grid grid-cols-7 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="col-span-2">Name</span>
                <span>Sex</span>
                <span>Type</span>
                <span>Cabin</span>
                <span className="text-right">Price</span>
                <span className="text-center">Status</span>
              </div>
              {trip.passengers.map((p) => (
                <PassengerRow
                  key={p.booking_trip_passenger_id ?? p.bookingTripPassengerId}
                  passenger={p}
                />
              ))}
            </div>
          </div>
        )}

        {/* Vehicles */}
        {trip.vehicles.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <IconCar className="h-4 w-4" />
              Vehicles ({activeVehicles.length})
            </h4>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Plate No.</span>
                <span>Make</span>
                <span>Model</span>
                <span>Type</span>
                <span className="text-right">Price</span>
                <span className="text-center">Status</span>
              </div>
              {trip.vehicles.map((v) => (
                <VehicleRow
                  key={v.booking_trip_cargo_id ?? v.bookingTripCargoId}
                  vehicle={v}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loose Cargos */}
        {(trip.cargos ?? trip.cargo ?? []).length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <IconPackage className="h-4 w-4" />
              Loose Cargo ({activeCargos.length})
            </h4>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="col-span-2">Description</span>
                <span>Weight</span>
                <span>Qty</span>
                <span className="text-right">Price</span>
                <span className="text-center">Status</span>
              </div>
              {(trip.cargos ?? trip.cargo ?? []).map((c) => (
                <CargoRow
                  key={c.booking_trip_cargo_id ?? c.bookingTripCargoId}
                  cargo={c}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PassengerRow({
  passenger: p,
}: {
  passenger: BookingTripPassengerView;
}) {
  const isRemoved = ["invalidated", "removed", "cancelled"].includes(
    (p.bookingStatus ?? p.checkInStatus ?? "").toLowerCase(),
  );

  return (
    <div
      className={`grid grid-cols-7 gap-2 px-3 py-2 text-sm border-b last:border-0 items-center ${isRemoved ? "opacity-50 line-through" : ""}`}
    >
      <span className="col-span-2 font-medium">
        {p.name ?? `${p.first_name} ${p.last_name}`}
      </span>
      <span className="text-muted-foreground">{p.sex}</span>
      <span className="text-muted-foreground">
        {p.discount_type ?? p.discountType ?? "Regular"}
      </span>
      <span className="text-muted-foreground">
        {p.cabinTypeName ?? p.cabin_type_name ?? p.accommodation ?? "—"}
      </span>
      <span className="text-right">{formatCurrency(p.price)}</span>
      <span className="text-center">
        <CheckInBadge status={p.bookingStatus ?? p.checkInStatus} />
      </span>
    </div>
  );
}

function VehicleRow({ vehicle: v }: { vehicle: BookingTripVehicleView }) {
  const isRemoved = ["invalidated", "removed", "cancelled"].includes(
    (v.bookingStatus ?? v.checkInStatus ?? "").toLowerCase(),
  );

  return (
    <div
      className={`grid grid-cols-6 gap-2 px-3 py-2 text-sm border-b last:border-0 items-center ${isRemoved ? "opacity-50 line-through" : ""}`}
    >
      <span className="font-mono text-xs">
        {v.plate_number ?? v.plateNumber}
      </span>
      <span className="text-muted-foreground">{v.make ?? "—"}</span>
      <span className="text-muted-foreground">{v.model ?? "—"}</span>
      <span className="text-muted-foreground">{v.type ?? "—"}</span>
      <span className="text-right">{formatCurrency(v.price)}</span>
      <span className="text-center">
        <CheckInBadge status={v.bookingStatus ?? v.checkInStatus} />
      </span>
    </div>
  );
}

function CargoRow({ cargo: c }: { cargo: BookingTripCargoView }) {
  const isRemoved = ["invalidated", "removed", "cancelled"].includes(
    (c.bookingStatus ?? c.checkInStatus ?? "").toLowerCase(),
  );

  return (
    <div
      className={`grid grid-cols-6 gap-2 px-3 py-2 text-sm border-b last:border-0 items-center ${isRemoved ? "opacity-50 line-through" : ""}`}
    >
      <span className="col-span-2">{c.description || "—"}</span>
      <span className="text-muted-foreground">
        {c.unitWeight ?? c.weight ?? 0} kg
      </span>
      <span className="text-muted-foreground">{c.quantity ?? 1}</span>
      <span className="text-right">{formatCurrency(c.price)}</span>
      <span className="text-center">
        <CheckInBadge status={c.bookingStatus ?? c.checkInStatus} />
      </span>
    </div>
  );
}

function CheckInBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="secondary">Pending</Badge>;
  const s = status.toLowerCase();

  if (s === "checked-in")
    return (
      <Badge variant="default" className="gap-1">
        <IconCheck className="h-3 w-3" /> Checked In
      </Badge>
    );
  if (s === "invalidated" || s === "removed" || s === "cancelled")
    return (
      <Badge variant="destructive" className="gap-1">
        <IconX className="h-3 w-3" /> {status}
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
}

function PaymentSection({ payments }: { payments?: BookingPaymentView[] }) {
  if (!payments?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconCreditCard className="h-5 w-5" />
          Payment Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-5 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Method</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
            <span>Reference</span>
          </div>
          {payments.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b last:border-0 items-center"
            >
              <span>{p.payment_method ?? p.epayment_method ?? "—"}</span>
              <span className="font-medium">{formatCurrency(p.amount)}</span>
              <span>
                <Badge variant={statusVariant(p.payment_status ?? "pending")}>
                  {p.payment_status ?? "Pending"}
                </Badge>
              </span>
              <span className="text-muted-foreground">
                {formatDate(p.payment_date)}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {p.transaction_number ?? p.cheque_number ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────

function BookingDetailSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`stat-${i}`} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading, error } = useBooking(bookingId);
  const [invalidateOpen, setInvalidateOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [rebookOpen, setRebookOpen] = useState(false);

  if (isLoading) return <BookingDetailSkeleton />;

  if (error || !booking) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <IconTicket className="h-16 w-16 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Booking Not Found</h2>
        <p className="text-muted-foreground">
          {error?.message ?? "The booking you're looking for doesn't exist."}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const departureTrips = booking.trips?.departure ?? [];
  const returnTrips = booking.trips?.return ?? [];
  const allTrips = [...departureTrips, ...returnTrips];
  const hasReturn = returnTrips.length > 0;

  // Aggregate counts across all active trips
  const totalPassengers = allTrips.reduce(
    (sum, t) =>
      sum +
      t.passengers.filter(
        (p) =>
          !["invalidated", "removed", "cancelled"].includes(
            (p.bookingStatus ?? "").toLowerCase(),
          ),
      ).length,
    0,
  );
  const totalVehicles = allTrips.reduce(
    (sum, t) =>
      sum +
      t.vehicles.filter(
        (v) =>
          !["invalidated", "removed", "cancelled"].includes(
            (v.bookingStatus ?? "").toLowerCase(),
          ),
      ).length,
    0,
  );
  const totalCargos = allTrips.reduce(
    (sum, t) =>
      sum +
      (t.cargos ?? t.cargo ?? []).filter(
        (c) =>
          !["invalidated", "removed", "cancelled"].includes(
            (c.bookingStatus ?? "").toLowerCase(),
          ),
      ).length,
    0,
  );

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/bookings")}
              >
                <IconArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {booking.reference_no ?? bookingId.slice(0, 8)}
                  </h1>
                  <Badge
                    variant={statusVariant(
                      booking.status ?? booking.booking_status,
                    )}
                  >
                    {booking.status ?? booking.booking_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Booked on {formatDateTime(booking.booking_created_at)}
                  {booking.source ? ` • Source: ${booking.source}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => globalThis.print()}
              >
                <IconPrinter className="mr-1 h-4 w-4" />
                Print
              </Button>
              {!["invalidated", "cancelled", "completed"].includes(
                (booking.status ?? booking.booking_status ?? "").toLowerCase(),
              ) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRebookOpen(true)}
                  >
                    <IconRefresh className="mr-1 h-4 w-4" />
                    Rebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefundOpen(true)}
                  >
                    <IconCash className="mr-1 h-4 w-4" />
                    Refund
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setInvalidateOpen(true)}
                  >
                    <IconBan className="mr-1 h-4 w-4" />
                    Invalidate
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="text-lg font-bold">
                  {booking.route_summary ?? "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Passengers</p>
                <p className="text-lg font-bold">{totalPassengers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Vehicles</p>
                <p className="text-lg font-bold">{totalVehicles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="text-lg font-bold">{totalCargos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Ticket Price</p>
                {(() => {
                  const commission =
                    Number(booking.ta_passenger_commission ?? 0) +
                    Number(booking.ta_cargo_commission ?? 0);
                  const markup = Number(booking.ta_markup ?? 0);
                  const base = Number(booking.price_without_markup ?? booking.total_price ?? 0);
                  const netPrice = base - commission;
                  return (
                    <>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(netPrice)}
                      </p>
                      {commission > 0 && (
                        <p className="text-xs text-blue-600">
                          − {formatCurrency(commission)} commission
                        </p>
                      )}
                      {markup > 0 && (
                        <p className="text-xs text-muted-foreground">
                          received {formatCurrency(markup)} markup
                        </p>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Trip Details */}
          {hasReturn ? (
            <Tabs defaultValue="departure">
              <TabsList>
                <TabsTrigger value="departure">
                  Departure ({departureTrips.length}{" "}
                  {departureTrips.length === 1 ? "leg" : "legs"})
                </TabsTrigger>
                <TabsTrigger value="return">
                  Return ({returnTrips.length}{" "}
                  {returnTrips.length === 1 ? "leg" : "legs"})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="departure" className="mt-4 space-y-4">
                {departureTrips.map((trip, i) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    label={`Departure${departureTrips.length > 1 ? ` Leg ${i + 1}` : ""}`}
                  />
                ))}
              </TabsContent>

              <TabsContent value="return" className="mt-4 space-y-4">
                {returnTrips.map((trip, i) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    label={`Return${returnTrips.length > 1 ? ` Leg ${i + 1}` : ""}`}
                  />
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              {departureTrips.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  label={`Departure${departureTrips.length > 1 ? ` Leg ${i + 1}` : ""}`}
                />
              ))}
            </div>
          )}

          {/* Payments */}
          <PaymentSection payments={booking.payments} />

          {/* Booking Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Booking ID</span>
                  <p className="font-mono text-xs mt-1">{booking.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="mt-1">{booking.booking_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Source</span>
                  <p className="mt-1">{booking.source}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Status</span>
                  <p className="mt-1">
                    <Badge
                      variant={statusVariant(
                        booking.payment_status ?? "pending",
                      )}
                    >
                      {booking.payment_status ?? "Pending"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ship(s)</span>
                  <p className="mt-1">{booking.ships_used ?? "—"}</p>
                </div>
                {booking.remarks && (
                  <div>
                    <span className="text-muted-foreground">Remarks</span>
                    <p className="mt-1">{booking.remarks}</p>
                  </div>
                )}
                {booking.issued_by && (
                  <div>
                    <span className="text-muted-foreground">Issued By</span>
                    <p className="mt-1">{booking.issued_by}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InvalidateModal
        open={invalidateOpen}
        onOpenChange={setInvalidateOpen}
        bookingId={bookingId}
        booking={booking}
      />
      <RefundModal
        open={refundOpen}
        onOpenChange={setRefundOpen}
        bookingId={bookingId}
        booking={booking}
      />
      <RebookModal
        open={rebookOpen}
        onOpenChange={setRebookOpen}
        bookingId={bookingId}
        booking={booking}
      />
    </>
  );
}
