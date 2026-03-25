"use client";

import {
  IconRoute,
  IconPercentage,
  IconCurrencyPeso,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  routesCount: number;
  maxFlatPassengerMarkup: number | null | undefined;
  maxFlatCargoMarkup: number | null | undefined;
  routesLoading: boolean;
  isLoading: boolean;
}

export function StatsCards({
  routesCount,
  maxFlatPassengerMarkup,
  maxFlatCargoMarkup,
  routesLoading,
  isLoading,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Available Routes
          </CardTitle>
          <IconRoute className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          {routesLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">{routesCount}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Max Passenger Markup
          </CardTitle>
          <IconCurrencyPeso className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {maxFlatPassengerMarkup != null
                ? `₱${Number(maxFlatPassengerMarkup).toLocaleString("en-PH")}`
                : "—"}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Max Cargo Markup
          </CardTitle>
          <IconPercentage className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {maxFlatCargoMarkup != null
                ? `₱${Number(maxFlatCargoMarkup).toLocaleString("en-PH")}`
                : "—"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
