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
import { useCreateMarkup } from "@/hooks/mutations/markup/use-markup-mutations";

interface CreateMarkupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  routeId: number;
  routeLabel: string;
  maxFlatPassengerMarkup: number | string;
  maxFlatCargoMarkup: number | string;
}

export function CreateMarkupModal({
  open,
  onOpenChange,
  agentId,
  routeId,
  routeLabel,
  maxFlatPassengerMarkup,
  maxFlatCargoMarkup,
}: CreateMarkupModalProps) {
  const [flatPassenger, setFlatPassenger] = useState("0");
  const [percentPassenger, setPercentPassenger] = useState("0");
  const [flatCargo, setFlatCargo] = useState("0");
  const [percentCargo, setPercentCargo] = useState("0");

  const maxFlatPassenger = Number(maxFlatPassengerMarkup) || 0;
  const maxFlatCargo = Number(maxFlatCargoMarkup) || 0;

  const createMarkup = useCreateMarkup();

  const flatPassengerNum = Number(flatPassenger) || 0;
  const percentPassengerNum = Number(percentPassenger) || 0;
  const flatCargoNum = Number(flatCargo) || 0;
  const percentCargoNum = Number(percentCargo) || 0;

  const flatPassengerExceeds =
    maxFlatPassenger > 0 && flatPassengerNum > maxFlatPassenger;
  const flatCargoExceeds = maxFlatCargo > 0 && flatCargoNum > maxFlatCargo;
  const hasValidationError = flatPassengerExceeds || flatCargoExceeds;

  function handleSubmit() {
    createMarkup.mutate(
      {
        travel_agent_id: agentId,
        travel_agency_route_id: routeId,
        flat_passenger_markup: flatPassengerNum,
        percentage_passenger_markup: percentPassengerNum,
        flat_cargo_markup: flatCargoNum,
        percentage_cargo_markup: percentCargoNum,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
  }

  function resetForm() {
    setFlatPassenger("0");
    setPercentPassenger("0");
    setFlatCargo("0");
    setPercentCargo("0");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Markup</DialogTitle>
          <DialogDescription>
            Set markup values for <strong>{routeLabel}</strong>
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
                  <Badge variant="outline">
                    ₱{maxFlatPassenger.toFixed(2)}
                  </Badge>
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
                <Label htmlFor="flat-passenger">Flat Amount (₱)</Label>
                <Input
                  id="flat-passenger"
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
                <Label htmlFor="percent-passenger">Percentage (%)</Label>
                <Input
                  id="percent-passenger"
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
                <Label htmlFor="flat-cargo">Flat Amount (₱)</Label>
                <Input
                  id="flat-cargo"
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
                <Label htmlFor="percent-cargo">Percentage (%)</Label>
                <Input
                  id="percent-cargo"
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMarkup.isPending || hasValidationError}
          >
            {createMarkup.isPending ? "Creating…" : "Create Markup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
