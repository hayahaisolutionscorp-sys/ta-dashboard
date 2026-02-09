"use client";

import {
  IconPlane,
  IconTicket,
  IconRoute,
  IconUsers,
  IconTrendingUp,
  IconCash,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder stats - replace with real data
const stats = [
  {
    title: "Total Bookings",
    value: "---",
    description: "Placeholder",
    icon: IconTicket,
    trend: "+0%",
  },
  {
    title: "Active Routes",
    value: "---",
    description: "Placeholder",
    icon: IconRoute,
    trend: "+0%",
  },
  {
    title: "Passengers",
    value: "---",
    description: "Placeholder",
    icon: IconUsers,
    trend: "+0%",
  },
  {
    title: "Revenue",
    value: "---",
    description: "Placeholder",
    icon: IconCash,
    trend: "+0%",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s your travel agency overview.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Area - Placeholders */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Chart Placeholder */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTrendingUp className="h-5 w-5" />
                Booking Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <IconTrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Chart placeholder - Booking trends will appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPlane className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <IconTicket className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recent bookings will appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Sections - Placeholders */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Available Routes Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconRoute className="h-5 w-5" />
                Available Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <IconRoute className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Route list placeholder
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPlane className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <IconPlane className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Quick action buttons placeholder
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
