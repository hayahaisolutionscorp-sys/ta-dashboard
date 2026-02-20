"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconTicket,
  IconSearch,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookings } from "@/hooks/queries/bookings/use-bookings";

function statusVariant(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "completed") return "default" as const;
  if (s === "pending") return "secondary" as const;
  if (s === "cancelled" || s === "failed") return "destructive" as const;
  return "outline" as const;
}

export default function BookingsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useBookings({
    page,
    page_size: 20,
  });

  const bookings = data?.data?.results ?? [];
  const total = data?.data?.total ?? 0;

  const filtered = search
    ? bookings.filter(
        (b) =>
          (b.reference_code ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (b.consignee ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : bookings;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground">
              Manage and view all your ferry bookings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <IconRefresh className="mr-1 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => router.push("/dashboard/book")}>
              <IconTicket className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by reference or consignee..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-4 text-sm text-red-600">
              Failed to load bookings: {error.message}
            </CardContent>
          </Card>
        )}

        {/* Bookings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Recent Bookings{" "}
              {total > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`skel-${i}`}
                    className="grid grid-cols-6 gap-4 py-3"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                <IconTicket className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No Bookings Found</p>
                <p className="text-sm">
                  {search
                    ? "No bookings match your search."
                    : "Create your first booking to get started."}
                </p>
                {!search && (
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/dashboard/book")}
                  >
                    Book a Trip
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 border-b pb-2 text-sm font-medium text-muted-foreground">
                  <span>Reference</span>
                  <span>Type</span>
                  <span>Source</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {/* Table Rows */}
                {filtered.map((booking) => (
                  <div
                    key={booking.id}
                    className="grid grid-cols-6 gap-4 py-3 border-b last:border-0 items-center text-sm"
                  >
                    <span className="font-mono text-xs">
                      {booking.reference_code ?? booking.id.slice(0, 8)}
                    </span>
                    <span>{booking.booking_type}</span>
                    <span className="text-muted-foreground">
                      {booking.booking_source}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <Badge variant={statusVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-fit"
                      onClick={() =>
                        router.push(`/dashboard/bookings/${booking.id}`)
                      }
                    >
                      <IconEye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-2">
                  Page {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
