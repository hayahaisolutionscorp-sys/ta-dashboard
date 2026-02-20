"use client";

import {
  IconCoin,
  IconShip,
  IconRoute,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function RatesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
          <p className="text-muted-foreground">
            View ferry rates and pricing for all available routes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by route, vessel, or port..."
              className="pl-9"
              disabled
            />
          </div>
          <Button variant="outline" disabled>
            <IconFilter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Stats Cards - Placeholder */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Routes
              </CardTitle>
              <IconRoute className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Vessels
              </CardTitle>
              <IconShip className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Range</CardTitle>
              <IconCoin className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        </div>

        {/* Rates Table - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Route Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header Placeholder */}
              <div className="grid grid-cols-5 gap-4 border-b pb-2 text-sm font-medium">
                <span>Route</span>
                <span>Vessel</span>
                <span>Economy</span>
                <span>Business</span>
                <span>Vehicle</span>
              </div>

              {/* Table Rows Placeholder */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}

              {/* Empty State Message */}
              <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                <IconCoin className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Rates Coming Soon</p>
                <p className="text-sm">
                  This page is under development. Rate viewing and management
                  features will be available soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
