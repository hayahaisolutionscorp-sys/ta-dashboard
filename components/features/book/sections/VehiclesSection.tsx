"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconTrash, IconCar } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useBookingFormUiStore } from "@/lib/stores/booking-form-ui.store";

interface TripInfo {
  id?: string;
  tripId?: string;
  tripType: "departure" | "return";
  sequence: number;
}

interface Vehicle {
  plateNumber: string;
  make?: string;
  modelName?: string;
  modelYear?: number;
  vehicleModelId?: number;
  vehicleTypeId?: number;
  usesPendingModel: boolean;
  driverId?: string;
  cargoClassCode?: string;
  tripAssignments: Array<{ tripId: string }>;
}

interface PassengerOption {
  index: number;
  label: string;
}

interface ClassOption {
  code: string;
  display: string;
}

interface VehiclesSectionProps {
  vehicles: Vehicle[];
  vehicleClasses: ClassOption[];
  trips: TripInfo[];
  passengers?: PassengerOption[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: unknown) => void;
}

export default function VehiclesSection({
  vehicles,
  vehicleClasses,
  trips,
  passengers = [],
  onRemove,
  onUpdate,
}: VehiclesSectionProps) {
  const isPricingLoading = useBookingFormUiStore((s) => s.isPricingLoading);
  const hasReturnTrip = trips.some((t) => t.tripType === "return");
  const returnTrip = trips.find((t) => t.tripType === "return");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <IconCar className="h-4 w-4 text-purple-600" />
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Vehicles ({vehicles.length})
        </h3>
      </div>

      <div className="space-y-3">
        {vehicles.map((vehicle, index) => (
          <div
            key={`vehicle-${index}`}
            className="bg-white rounded-lg p-3 border border-purple-200 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-700">
                Vehicle {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                onClick={() => onRemove(index)}
              >
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Plate & Make */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Plate number"
                className="h-7 text-xs"
                value={vehicle.plateNumber}
                onChange={(e) => onUpdate(index, "plateNumber", e.target.value)}
              />
              <Input
                placeholder="Make (e.g. Toyota)"
                className="h-7 text-xs"
                value={vehicle.make ?? ""}
                onChange={(e) => onUpdate(index, "make", e.target.value)}
              />
            </div>

            {/* Model & Year */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Model name"
                className="h-7 text-xs"
                value={vehicle.modelName ?? ""}
                onChange={(e) => onUpdate(index, "modelName", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Year"
                className="h-7 text-xs"
                value={vehicle.modelYear ?? ""}
                onChange={(e) =>
                  onUpdate(index, "modelYear", Number(e.target.value))
                }
              />
            </div>

            {/* Driver & Class */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={vehicle.driverId ?? ""}
                onValueChange={(val) =>
                  onUpdate(index, "driverId", val === "__none__" ? "" : val)
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Driver (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No driver</SelectItem>
                  {passengers.map((pax) => (
                    <SelectItem key={pax.index} value={pax.index.toString()}>
                      {pax.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {vehicleClasses.length > 0 && (
                <Select
                  value={vehicle.cargoClassCode ?? ""}
                  disabled={isPricingLoading}
                  onValueChange={(val) =>
                    onUpdate(index, "cargoClassCode", val)
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Vehicle class" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleClasses.map((cls) => (
                      <SelectItem key={cls.code} value={cls.code}>
                        {cls.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Include in return trip toggle */}
            {hasReturnTrip && returnTrip && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={vehicle.tripAssignments.some(
                    (a) => a.tripId === (returnTrip.id ?? returnTrip.tripId),
                  )}
                  onCheckedChange={(checked) => {
                    const returnTripId = returnTrip.id ?? returnTrip.tripId;
                    if (!returnTripId) return;
                    const updated = checked
                      ? [
                          ...vehicle.tripAssignments,
                          { tripId: returnTripId },
                        ]
                      : vehicle.tripAssignments.filter(
                          (a) => a.tripId !== returnTripId,
                        );
                    onUpdate(index, "tripAssignments", updated);
                  }}
                />
                <span className="text-xs text-gray-600">
                  Include in return trip
                </span>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
