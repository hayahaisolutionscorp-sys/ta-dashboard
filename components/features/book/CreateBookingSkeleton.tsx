"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateBookingSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-350 mx-auto w-full">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main content skeleton */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Controls & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>

                {/* Passenger area */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-16 w-full" />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side panel skeleton */}
          <div className="hidden lg:block w-72 shrink-0 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Card>
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
