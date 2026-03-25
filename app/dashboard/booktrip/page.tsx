"use client";

import {
  IconShip,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconArrowRight,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function BookTripPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book a Trip</h1>
          <p className="text-muted-foreground">
            Search and book ferry trips for your customers
          </p>
        </div>

        {/* Search Form - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShip className="h-5 w-5" />
              Trip Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origin Port</Label>
                <div className="relative">
                  <IconMapPin className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="origin"
                    placeholder="Select origin..."
                    className="pl-9"
                    disabled
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">Destination Port</Label>
                <div className="relative">
                  <IconMapPin className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="destination"
                    placeholder="Select destination..."
                    className="pl-9"
                    disabled
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Travel Date</Label>
                <div className="relative">
                  <IconCalendar className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input id="date" type="date" className="pl-9" disabled />
                </div>
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <div className="relative">
                  <IconUsers className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="passengers"
                    type="number"
                    placeholder="1"
                    className="pl-9"
                    min={1}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button disabled>
                Search Trips
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Trips - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Available Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Trip Cards Placeholder */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Route Info */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Skeleton className="mx-auto h-6 w-16" />
                        <Skeleton className="mx-auto mt-1 h-4 w-20" />
                      </div>
                      <IconArrowRight className="text-muted-foreground h-4 w-4" />
                      <div className="text-center">
                        <Skeleton className="mx-auto h-6 w-16" />
                        <Skeleton className="mx-auto mt-1 h-4 w-20" />
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Skeleton className="ml-auto h-6 w-24" />
                        <Skeleton className="ml-auto mt-1 h-4 w-16" />
                      </div>
                      <Button variant="outline" disabled>
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Empty State Message */}
              <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                <IconShip className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Trip Booking Coming Soon</p>
                <p className="text-sm">
                  This page is under development. Trip search and booking
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
