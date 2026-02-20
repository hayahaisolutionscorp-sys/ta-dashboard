"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconUsers, IconCar, IconPackage } from "@tabler/icons-react";

interface BookingControlsProps {
  passengersCount: number;
  vehiclesCount: number;
  looseCargosCount: number;
  cabinType: string;
  availableCabinTypes: string[];
  onCabinTypeChange: (type: string) => void;
  onAddPassenger: () => void;
  onAddVehicle: () => void;
  onAddCargo: () => void;
}

export default function BookingControls({
  passengersCount,
  vehiclesCount,
  looseCargosCount,
  cabinType,
  availableCabinTypes,
  onCabinTypeChange,
  onAddPassenger,
  onAddVehicle,
  onAddCargo,
}: BookingControlsProps) {
  return (
    <div className="space-y-3">
      {/* Cabin Type Selector */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500 font-medium">Cabin Type</label>
        <Select value={cabinType} onValueChange={onCabinTypeChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select cabin" />
          </SelectTrigger>
          <SelectContent>
            {availableCabinTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add Buttons */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
          onClick={onAddPassenger}
        >
          <IconUsers className="h-4 w-4" />
          <IconPlus className="h-3 w-3" />
          Add Passenger
          {passengersCount > 0 && (
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              {passengersCount}
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
          onClick={onAddVehicle}
        >
          <IconCar className="h-4 w-4" />
          <IconPlus className="h-3 w-3" />
          Add Vehicle
          {vehiclesCount > 0 && (
            <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              {vehiclesCount}
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
          onClick={onAddCargo}
        >
          <IconPackage className="h-4 w-4" />
          <IconPlus className="h-3 w-3" />
          Add Cargo
          {looseCargosCount > 0 && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              {looseCargosCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
