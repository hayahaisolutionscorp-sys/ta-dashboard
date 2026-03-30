"use client";

import Link from "next/link";
import {
  IconSpeedboatFilled,
  IconTicket,
  IconRoute,
  IconWallet,
  IconArrowRight,
  IconArrowDownLeft,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useBookings } from "@/hooks/queries/bookings/use-bookings";
import { useRoutesForAgency } from "@/hooks/queries/routes/use-routes";
import { useAgencyWallet } from "@/hooks/queries/wallet/use-wallet";

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusVariant(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "completed") return "default" as const;
  if (s === "pending") return "secondary" as const;
  if (s === "cancelled" || s === "failed") return "destructive" as const;
  return "outline" as const;
}

export default function DashboardPage() {
  const currentUser = useAuthStore((s) => s.user);

  const isAdmin = currentUser?.role === "Admin";

  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({
    page: 1,
    page_size: 5,
    // Admin sees all agency bookings on dashboard; Staff sees only their own
    userId: isAdmin ? undefined : currentUser?.id,
    agencyId: currentUser?.travel_agency_id,
  });

  const { data: routes, isLoading: routesLoading } = useRoutesForAgency(
    currentUser?.travel_agency_id,
  );

  const { data: walletData, isLoading: walletLoading } = useAgencyWallet(
    currentUser?.travel_agency_id,
  );

  const totalBookings = bookingsData?.total ?? 0;
  const recentBookings = bookingsData?.results ?? [];
  const activeRoutes = routes?.length ?? 0;
  const walletBalance = Number(walletData?.balance?.balance ?? 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {currentUser?.travel_agent_name ?? "Travel Agent"}!
              Here&apos;s your overview.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Bookings
              </CardTitle>
              <IconTicket className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalBookings}</div>
              )}
              <p className="text-xs text-muted-foreground">
                All time booking count
              </p>
            </CardContent>
          </Card>

          {/* Active Routes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Routes
              </CardTitle>
              <IconRoute className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {routesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{activeRoutes}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Routes available for booking
              </p>
            </CardContent>
          </Card>

          {/* Wallet Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Wallet Balance
              </CardTitle>
              <IconWallet className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(walletBalance)}
                </div>
              )}
              <Link
                href="/dashboard/wallet"
                className="text-xs text-primary hover:underline"
              >
                View wallet details →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Bookings */}
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconTicket className="size-5" />
                Recent Bookings
              </CardTitle>
              <Link href="/dashboard/bookings">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all
                  <IconArrowRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`skel-${i}`}
                      className="flex items-center justify-between py-3 border-b"
                    >
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentBookings.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <IconTicket className="mx-auto size-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No bookings yet. Create your first booking!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {recentBookings.slice(0, 5).map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/dashboard/bookings/${booking.id}`}
                      className="flex items-center justify-between py-3 hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {booking.route_summary ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.reference_no ?? booking.id.slice(0, 8)} ·{" "}
                          {booking.booking_created_at
                            ? new Date(
                                booking.booking_created_at,
                              ).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {booking.total_price && (
                          <span className="text-sm font-semibold">
                            {formatCurrency(booking.total_price)}
                          </span>
                        )}
                        <Badge variant={statusVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions + Available Routes */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSpeedboatFilled className="size-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/dashboard/book">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <IconSpeedboatFilled className="size-4" />
                    Book a Trip
                  </Button>
                </Link>
                <Link href="/dashboard/wallet">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <IconArrowDownLeft className="size-4 text-green-500" />
                    Deposit Funds
                  </Button>
                </Link>
                <Link href="/dashboard/wallet">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <IconArrowUpRight className="size-4 text-red-500" />
                    Request Withdrawal
                  </Button>
                </Link>
                <Link href="/dashboard/bookings">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <IconTicket className="size-4" />
                    View All Bookings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Available Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconRoute className="size-5" />
                  Available Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={`route-skel-${i}`}
                        className="h-10 w-full"
                      />
                    ))}
                  </div>
                ) : !routes || routes.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No routes available
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {routes.slice(0, 5).map((route) => (
                      <div
                        key={route.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="text-sm">
                          <span className="font-medium">
                            {route.src_port_code}
                          </span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="font-medium">
                            {route.dest_port_code}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {route.src_port_name} → {route.dest_port_name}
                        </span>
                      </div>
                    ))}
                    {routes.length > 5 && (
                      <p className="pt-2 text-xs text-muted-foreground text-center">
                        +{routes.length - 5} more routes
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
