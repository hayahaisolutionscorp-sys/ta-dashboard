"use client";

import { useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUpdateMarkup } from "@/hooks/mutations/markup/use-markup-mutations";
import type { MarkupEntity } from "@/lib/types/markup.types";

interface UpdateMarkupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markup: MarkupEntity;
  routeLabel: string;
  maxFlatPassengerMarkup: number | string;
  maxFlatCargoMarkup: number | string;
}

export function UpdateMarkupModal({
  open,
  onOpenChange,
  markup,
  routeLabel,
  maxFlatPassengerMarkup,
  maxFlatCargoMarkup,
}: UpdateMarkupModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <UpdateMarkupForm
            markup={markup}
            routeLabel={routeLabel}
            maxFlatPassengerMarkup={maxFlatPassengerMarkup}
            maxFlatCargoMarkup={maxFlatCargoMarkup}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UpdateMarkupForm({
  markup,
  routeLabel,
  maxFlatPassengerMarkup,
  maxFlatCargoMarkup,
  onClose,
}: {
  markup: MarkupEntity;
  routeLabel: string;
  maxFlatPassengerMarkup: number | string;
  maxFlatCargoMarkup: number | string;
  onClose: () => void;
}) {
  const [flatPassenger, setFlatPassenger] = useState(
    String(markup.flat_passenger_markup),
  );
  const [percentPassenger, setPercentPassenger] = useState(
    String(markup.percentage_passenger_markup),
  );
  const [flatCargo, setFlatCargo] = useState(String(markup.flat_cargo_markup));
  const [percentCargo, setPercentCargo] = useState(
    String(markup.percentage_cargo_markup),
  );

  const maxFlatPassenger = Number(maxFlatPassengerMarkup) || 0;
  const maxFlatCargo = Number(maxFlatCargoMarkup) || 0;

  const flatPassengerNum = Number(flatPassenger) || 0;
  const percentPassengerNum = Number(percentPassenger) || 0;
  const flatCargoNum = Number(flatCargo) || 0;
  const percentCargoNum = Number(percentCargo) || 0;

  const flatPassengerExceeds =
    maxFlatPassenger > 0 && flatPassengerNum > maxFlatPassenger;
  const flatCargoExceeds = maxFlatCargo > 0 && flatCargoNum > maxFlatCargo;
  const hasValidationError = flatPassengerExceeds || flatCargoExceeds;

  const updateMutation = useUpdateMarkup();

  function handleSubmit() {
    updateMutation.mutate(
      {
        agentId: markup.travel_agent_id,
        routeId: markup.travel_agency_route_id,
        payload: {
          flat_passenger_markup: flatPassengerNum,
          percentage_passenger_markup: percentPassengerNum,
          flat_cargo_markup: flatCargoNum,
          percentage_cargo_markup: percentCargoNum,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Update Markup</DialogTitle>
        <DialogDescription>
          Modify markup values for <strong>{routeLabel}</strong>
        </DialogDescription>
      </DialogHeader>

      {/* Max limits info */}
      {(maxFlatPassenger > 0 || maxFlatCargo > 0) && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
            Route Flat Markup Limits
          </p>
          <div className="flex gap-4">
            {maxFlatPassenger > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-sm">
                  Max Passenger Flat:
                </span>
                <Badge variant="outline">₱{maxFlatPassenger.toFixed(2)}</Badge>
              </div>
            )}
            {maxFlatCargo > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-sm">
                  Max Cargo Flat:
                </span>
                <Badge variant="outline">₱{maxFlatCargo.toFixed(2)}</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-5 py-2">
        {/* Passenger Markup */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Passenger Markup</legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="update-flat-passenger">Flat Amount (₱)</Label>
              <Input
                id="update-flat-passenger"
                type="number"
                min="0"
                step="0.01"
                value={flatPassenger}
                onChange={(e) => setFlatPassenger(e.target.value)}
              />
              {flatPassengerExceeds && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <IconAlertCircle className="h-3 w-3" />
                  Exceeds max ₱{maxFlatPassenger.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="update-percent-passenger">Percentage (%)</Label>
              <Input
                id="update-percent-passenger"
                type="number"
                min="0"
                step="0.01"
                value={percentPassenger}
                onChange={(e) => setPercentPassenger(e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {/* Cargo Markup */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Cargo Markup</legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="update-flat-cargo">Flat Amount (₱)</Label>
              <Input
                id="update-flat-cargo"
                type="number"
                min="0"
                step="0.01"
                value={flatCargo}
                onChange={(e) => setFlatCargo(e.target.value)}
              />
              {flatCargoExceeds && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <IconAlertCircle className="h-3 w-3" />
                  Exceeds max ₱{maxFlatCargo.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="update-percent-cargo">Percentage (%)</Label>
              <Input
                id="update-percent-cargo"
                type="number"
                min="0"
                step="0.01"
                value={percentCargo}
                onChange={(e) => setPercentCargo(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || hasValidationError}
        >
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}
