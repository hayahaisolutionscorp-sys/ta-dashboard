"use client";

import { useState } from "react";
import {
  IconPercentage,
  IconCoin,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkupByAgentAndRoute } from "@/hooks/queries/markup/use-markups";
import { CreateMarkupModal } from "./create-markup-modal";
import { UpdateMarkupModal } from "./update-markup-modal";
import type { RouteEntity } from "@/constants/entities/route.entity";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface MarkupSectionProps {
  agentId: string | undefined;
  selectedRoute: RouteEntity | undefined;
  routeLabel: string;
}

export function MarkupSection({
  agentId,
  selectedRoute,
  routeLabel,
}: MarkupSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

  const routeId = selectedRoute?.id;

  const {
    data: markup,
    isLoading,
    isFetched,
  } = useMarkupByAgentAndRoute(agentId, routeId);

  if (!selectedRoute) {
    return null;
  }

  const hasMarkup = isFetched && markup != null;
  const noMarkup = isFetched && markup == null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconPercentage className="h-5 w-5" />
              Agent Markup — {routeLabel}
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Your commission markup applied on top of the base rates
            </p>
          </div>
          {hasMarkup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateOpen(true)}
            >
              <IconEdit className="mr-1.5 h-4 w-4" />
              Edit Markup
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : noMarkup ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <IconPercentage className="text-muted-foreground mb-3 h-10 w-10 opacity-40" />
              <p className="font-medium">No markup configured</p>
              <p className="text-muted-foreground mb-4 text-sm">
                Set up your commission markup for this route
              </p>
              <Button onClick={() => setCreateOpen(true)} type="button">
                <IconPlus className="mr-1.5 h-4 w-4" />
                Create Markup
              </Button>
            </div>
          ) : hasMarkup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Passenger Markup Card */}
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <IconCoin className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Passenger Markup
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Flat Amount</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(markup.flat_passenger_markup)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Percentage</p>
                    <p className="text-lg font-bold">
                      {markup.percentage_passenger_markup}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Cargo Markup Card */}
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <IconCoin className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-semibold">Cargo Markup</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Flat Amount</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(markup.flat_cargo_markup)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Percentage</p>
                    <p className="text-lg font-bold">
                      {markup.percentage_cargo_markup}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Limits Summary */}
              {(selectedRoute.max_flat_passenger_markup > 0 ||
                selectedRoute.max_flat_cargo_markup > 0) && (
                <div className="text-muted-foreground col-span-full flex items-center gap-3 text-xs">
                  <span>Route limits:</span>
                  {selectedRoute.max_flat_passenger_markup > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Max passenger flat{" "}
                      {formatCurrency(selectedRoute.max_flat_passenger_markup)}
                    </Badge>
                  )}
                  {selectedRoute.max_flat_cargo_markup > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Max cargo flat{" "}
                      {formatCurrency(selectedRoute.max_flat_cargo_markup)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {agentId && selectedRoute && (
        <CreateMarkupModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          agentId={agentId}
          routeId={selectedRoute.id}
          routeLabel={routeLabel}
          maxFlatPassengerMarkup={selectedRoute.max_flat_passenger_markup}
          maxFlatCargoMarkup={selectedRoute.max_flat_cargo_markup}
        />
      )}

      {/* Update Modal */}
      {markup && (
        <UpdateMarkupModal
          open={updateOpen}
          onOpenChange={setUpdateOpen}
          markup={markup}
          routeLabel={routeLabel}
          maxFlatPassengerMarkup={selectedRoute.max_flat_passenger_markup}
          maxFlatCargoMarkup={selectedRoute.max_flat_cargo_markup}
        />
      )}
    </>
  );
}
