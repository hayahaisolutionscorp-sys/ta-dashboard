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
import { IconTrash, IconUser } from "@tabler/icons-react";
import { useBookingFormUiStore } from "@/lib/stores/booking-form-ui.store";

interface TripInfo {
  id?: string;
  tripId?: string;
  tripType: "departure" | "return";
  sequence: number;
  cabins?: Array<{ id: number; name: string }>;
}

interface TripAssignment {
  tripId: string;
  cabinId: number | null;
  discountType: string;
  cabin_type_name?: string;
}

interface Passenger {
  firstName: string;
  lastName: string;
  email?: string;
  sex: "male" | "female";
  birthday: Date;
  address?: string;
  nationality: string;
  occupation?: string;
  civilStatus?: string;
  mobileNumber?: string;
  tripAssignments: TripAssignment[];
}

interface PassengersSectionProps {
  passengers: Passenger[];
  trips: TripInfo[];
  discountTypes: string[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: unknown) => void;
}

export default function PassengersSection({
  passengers,
  trips,
  discountTypes,
  onRemove,
  onUpdate,
}: PassengersSectionProps) {
  const isPricingLoading = useBookingFormUiStore((s) => s.isPricingLoading);
  const formatDate = (date: Date): string => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <IconUser className="h-4 w-4 text-blue-600" />
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Passengers ({passengers.length})
        </h3>
      </div>

      <div className="space-y-3">
        {passengers.map((passenger, index) => (
          <div
            key={`passenger-${index}`}
            className="bg-white rounded-lg p-3 border border-blue-200 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">
                Passenger {index + 1}
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

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  placeholder="First name"
                  className="h-7 text-xs"
                  value={passenger.firstName}
                  onChange={(e) => onUpdate(index, "firstName", e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Last name"
                  className="h-7 text-xs"
                  value={passenger.lastName}
                  onChange={(e) => onUpdate(index, "lastName", e.target.value)}
                />
              </div>
            </div>

            {/* Sex, Birthday, Nationality */}
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={passenger.sex}
                onValueChange={(val) => onUpdate(index, "sex", val)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                className="h-7 text-xs"
                value={formatDate(passenger.birthday)}
                onChange={(e) => {
                  const dateVal = e.target.value
                    ? new Date(e.target.value)
                    : new Date(2000, 0, 1);
                  onUpdate(index, "birthday", dateVal);
                }}
              />

              <Input
                placeholder="Nationality"
                className="h-7 text-xs"
                value={passenger.nationality}
                onChange={(e) => onUpdate(index, "nationality", e.target.value)}
              />
            </div>

            {/* Passenger Type (shared across all trips) */}
            <div className="bg-gray-50 rounded p-1.5">
              <Select
                value={passenger.tripAssignments[0]?.discountType ?? ""}
                disabled={isPricingLoading}
                onValueChange={(val) => {
                  // Sync discount type to ALL trip assignments
                  const updated = passenger.tripAssignments.map((a) => ({
                    ...a,
                    discountType: val,
                  }));
                  onUpdate(index, "tripAssignments", updated);
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Passenger Type" />
                </SelectTrigger>
                <SelectContent>
                  {discountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cabin selectors per trip (only when >1 cabin option) */}
            {passenger.tripAssignments.map((assignment, tripIdx) => {
              const trip = trips[tripIdx];
              if (!trip) return null;

              const uniqueCabins = trip.cabins
                ? Array.from(
                    new Map(
                      trip.cabins.map((c) => [c.name.toUpperCase(), c]),
                    ).values(),
                  )
                : [];

              if (uniqueCabins.length <= 1) return null;

              const tripLabel =
                trip.tripType === "return" ? "Return" : "Departure";

              return (
                <div
                  key={`cabin-${tripIdx}`}
                  className="bg-gray-50 rounded p-1.5 space-y-1"
                >
                  <span className="text-[10px] text-gray-500 font-medium">
                    {tripLabel} Cabin
                  </span>
                  <Select
                    value={
                      assignment.cabinId ? String(assignment.cabinId) : ""
                    }
                    disabled={isPricingLoading}
                    onValueChange={(val) => {
                      const updated = [...passenger.tripAssignments];
                      const selectedCabin = trips[tripIdx]?.cabins?.find(
                        (c) => c.id === Number(val),
                      );
                      updated[tripIdx] = {
                        ...updated[tripIdx],
                        cabinId: Number(val),
                        cabin_type_name: selectedCabin?.name,
                      };
                      onUpdate(index, "tripAssignments", updated);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Cabin" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCabins.map((cabin) => (
                        <SelectItem key={cabin.id} value={String(cabin.id)}>
                          {cabin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
