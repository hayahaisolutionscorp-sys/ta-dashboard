"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBookingData } from "@/hooks/queries/bookings/use-booking-data";
import { useCreateBooking } from "@/hooks/mutations/bookings/use-create-booking";
import {
  CreateBookingSchema,
  type BookingFormData,
} from "@/lib/validators/booking.validators";
import type { BookingRateSnapshot, TripView } from "@/lib/types/booking.types";
import PassengersSection from "@/components/features/book/sections/PassengersSection";
import VehiclesSection from "@/components/features/book/sections/VehiclesSection";
import LooseCargosSection from "@/components/features/book/sections/LooseCargosSection";
import ContactInfoSection from "@/components/features/book/sections/ContactInfoSection";
import BookingControls from "@/components/features/book/sections/BookingControls";
import BookingConfirm from "@/components/features/book/BookingConfirm";
import TripSummaryPanel from "@/components/features/book/TripSummaryPanel";
import CreateBookingSkeleton from "@/components/features/book/CreateBookingSkeleton";
import { IconArrowLeft } from "@tabler/icons-react";

export default function CreateBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate: createBooking, isPending } = useCreateBooking();

  // Fetch booking preparation data
  const {
    data: bookingResponse,
    isLoading,
    error,
  } = useBookingData(searchParams);

  const bookingData = bookingResponse?.data;

  // 2-step flow: 1 = form, 2 = confirm
  const [step, setStep] = useState(1);

  // Flatten departure and return segments into trips array
  const allTrips = useMemo(() => {
    if (!bookingData) return [];
    const departureSegments = Array.isArray(bookingData.departure)
      ? bookingData.departure
      : bookingData.departure
        ? [bookingData.departure]
        : [];
    const returnSegments = Array.isArray(bookingData.return)
      ? bookingData.return
      : bookingData.return
        ? [bookingData.return]
        : [];
    return [
      ...departureSegments.map((trip: TripView, index: number) => ({
        ...trip,
        tripType: "departure" as const,
        sequence: index + 1,
        cabins: trip.ship?.cabins ?? [],
      })),
      ...returnSegments.map((trip: TripView, index: number) => ({
        ...trip,
        tripType: "return" as const,
        sequence: index + 1,
        cabins: trip.ship?.cabins ?? [],
      })),
    ];
  }, [bookingData]);

  // Derive available options from rates
  const derivedOptions = useMemo(() => {
    const rates = bookingData?.rates ?? [];
    const discountTypesSet = new Set<string>();
    const vehicleClassesSet = new Set<string>();
    const cargoClassesSet = new Set<string>();
    const validAccommodations = new Set<string>();

    if (rates.length === 0) {
      const FALLBACK = ["Adult", "Child", "Senior", "Student", "PWD", "Infant"];
      for (const t of FALLBACK) {
        discountTypesSet.add(t);
      }
    } else {
      for (const snapshot of rates as BookingRateSnapshot[]) {
        for (const r of snapshot.passenger_rates) {
          discountTypesSet.add(r.passenger_type_code);
          validAccommodations.add(r.accom_code);
        }
        for (const r of snapshot.cargo_rates) {
          const type = r.cargo_type_code?.toUpperCase() || "";
          if (type.includes("ROLLING")) {
            vehicleClassesSet.add(r.cargo_class_code);
          } else {
            cargoClassesSet.add(r.cargo_class_code);
          }
        }
      }
    }

    const discountTypes = Array.from(discountTypesSet).sort((a, b) => {
      if (a.toLowerCase() === "adult") return -1;
      if (b.toLowerCase() === "adult") return 1;
      return a.localeCompare(b);
    });

    // Derive available cabin types from ships
    const shipCabinTypes = new Set<string>();
    const trips = [
      ...(bookingData?.departure
        ? Array.isArray(bookingData.departure)
          ? bookingData.departure
          : [bookingData.departure]
        : []),
      ...(bookingData?.return
        ? Array.isArray(bookingData.return)
          ? bookingData.return
          : [bookingData.return]
        : []),
    ];
    for (const trip of trips) {
      for (const cabin of trip.ship?.cabins ?? []) {
        if (cabin.name) {
          shipCabinTypes.add(cabin.name.toUpperCase());
        }
      }
    }

    let availableCabinTypes = Array.from(shipCabinTypes)
      .filter((ct) => validAccommodations.has(ct.toUpperCase()))
      .sort();

    if (availableCabinTypes.length === 0 && shipCabinTypes.size > 0) {
      availableCabinTypes = Array.from(shipCabinTypes).sort();
    } else if (availableCabinTypes.length === 0) {
      availableCabinTypes = ["Aircon", "Non-Aircon"];
    }

    return {
      discountTypes,
      vehicleClasses: Array.from(vehicleClassesSet).sort(),
      cargoClasses: Array.from(cargoClassesSet).sort(),
      validAccommodations,
      availableCabinTypes,
    };
  }, [bookingData]);

  const { discountTypes, vehicleClasses, cargoClasses, availableCabinTypes } =
    derivedOptions;

  const [cabinType, setCabinType] = useState<string>("");

  // Set initial cabin type when options load
  useEffect(() => {
    if (availableCabinTypes.length > 0 && !cabinType) {
      setCabinType(availableCabinTypes[0]);
    }
  }, [availableCabinTypes, cabinType]);

  // Initialize form
  const form = useForm<BookingFormData>({
    resolver: zodResolver(CreateBookingSchema),
    defaultValues: {
      bookingType: "Single",
      trips: [],
      passengers: [],
      vehicles: [],
      looseCargos: [],
      consignee: "",
      contactAddress: "",
      contactMobileNumber: "",
      contactEmail: "",
      voucherCode: "",
      referralCode: "",
      remarks: "",
    },
  });

  // Update form trips when booking data loads
  useEffect(() => {
    if (allTrips.length > 0) {
      form.setValue(
        "bookingType",
        allTrips.some((t) => t.tripType === "return") ? "Round Trip" : "Single",
      );
      form.setValue(
        "trips",
        allTrips.map((trip) => ({
          tripType: trip.tripType,
          sequence: trip.sequence,
          tripId: trip.id,
        })),
      );
    }
  }, [allTrips, form]);

  const { watch, handleSubmit } = form;
  const passengers = watch("passengers");
  const vehicles = watch("vehicles");
  const looseCargos = watch("looseCargos");

  // Add/remove handlers
  const handleAddPassenger = () => {
    const current = form.getValues("passengers");
    const defaultDiscount =
      discountTypes.find((t) => t.toLowerCase() === "adult") ||
      discountTypes[0] ||
      "Adult";

    form.setValue("passengers", [
      ...current,
      {
        firstName: "",
        lastName: "",
        email: "",
        sex: "male" as const,
        birthday: new Date(2000, 0, 1),
        address: "",
        nationality: "FILIPINO",
        occupation: "",
        civilStatus: "Single",
        mobileNumber: "",
        tripAssignments: allTrips.map((trip) => {
          const matchingCabin = trip.cabins?.find(
            (c) => (c.name || "").toUpperCase() === cabinType.toUpperCase(),
          );
          return {
            tripId: trip.id,
            cabinId: matchingCabin
              ? matchingCabin.id
              : (trip.cabins?.at(0)?.id ?? null),
            discountType: defaultDiscount,
          };
        }),
      },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    const current = form.getValues("passengers");
    form.setValue(
      "passengers",
      current.filter((_, i) => i !== index),
    );
  };

  const handleAddVehicle = () => {
    const current = form.getValues("vehicles");
    form.setValue("vehicles", [
      ...current,
      {
        plateNumber: "",
        make: "Toyota",
        modelName: "",
        modelYear: new Date().getFullYear(),
        vehicleModelId: undefined,
        vehicleTypeId: 1,
        usesPendingModel: false,
        driverId: "",
        cargoClassCode: "",
        tripAssignments: allTrips.map((trip) => ({
          tripId: trip.id,
        })),
      },
    ]);
  };

  const handleRemoveVehicle = (index: number) => {
    const current = form.getValues("vehicles");
    form.setValue(
      "vehicles",
      current.filter((_, i) => i !== index),
    );
  };

  const handleAddCargo = () => {
    const current = form.getValues("looseCargos");
    form.setValue("looseCargos", [
      ...current,
      {
        description: "",
        weight: 1,
        quantity: 1,
        cargoClassCode: "",
        tripAssignments: allTrips.map((trip) => ({
          tripId: trip.id,
        })),
      },
    ]);
  };

  const handleRemoveCargo = (index: number) => {
    const current = form.getValues("looseCargos");
    form.setValue(
      "looseCargos",
      current.filter((_, i) => i !== index),
    );
  };

  const handleCabinTypeChange = (type: string) => {
    setCabinType(type);
    const currentPassengers = form.getValues("passengers");
    const updatedPassengers = currentPassengers.map((p) => ({
      ...p,
      tripAssignments: p.tripAssignments.map((assignment, index: number) => {
        const trip = allTrips[index];
        const matchingCabin = trip?.cabins?.find(
          (c) => (c.name || "").toUpperCase() === type.toUpperCase(),
        );
        return {
          ...assignment,
          cabinId: matchingCabin ? matchingCabin.id : assignment.cabinId,
        };
      }),
    }));
    form.setValue("passengers", updatedPassengers);
  };

  const onSubmit: SubmitHandler<BookingFormData> = () => {
    // Go to confirm step
    setStep(2);
  };

  const handleConfirmBooking = () => {
    const rawFormData = form.getValues();

    // Clean data for submission
    const formData = {
      ...rawFormData,
      passengers: rawFormData.passengers.map((p) => ({
        ...p,
        address: p.address || rawFormData.contactAddress,
        mobileNumber: p.mobileNumber || rawFormData.contactMobileNumber,
        email: p.email || rawFormData.contactEmail,
      })),
    };

    createBooking(formData, {
      onSuccess: () => {
        router.push(`/dashboard/bookings`);
      },
      onError: (err) => {
        console.error("Failed to create booking:", err);
      },
    });
  };

  const onError = (errors: Record<string, unknown>) => {
    console.error("Form validation failed:", errors);
  };

  if (isLoading) {
    return <CreateBookingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Error Loading Booking Data
          </h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.back()}
            type="button"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Trip Selected</h2>
          <p className="text-sm text-muted-foreground">
            Please select a trip to create a booking.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push("/dashboard/book")}
            type="button"
          >
            Search Trips
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-350 mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step === 2 ? setStep(1) : router.back())}
            type="button"
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {step === 1 ? "Create Booking" : "Confirm Booking"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1
                ? "Fill in passenger, vehicle, and cargo details"
                : "Review and confirm your booking"}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {step === 1 ? (
              <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit, onError)}>
                  <Card>
                    <CardContent className="p-4 md:p-6 space-y-4">
                      {/* Controls & Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Booking Details
                          </h3>
                          <BookingControls
                            passengersCount={passengers?.length || 0}
                            vehiclesCount={vehicles?.length || 0}
                            looseCargosCount={looseCargos?.length || 0}
                            cabinType={cabinType}
                            availableCabinTypes={availableCabinTypes}
                            onCabinTypeChange={handleCabinTypeChange}
                            onAddPassenger={handleAddPassenger}
                            onAddVehicle={handleAddVehicle}
                            onAddCargo={handleAddCargo}
                          />
                        </div>
                        <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                          <ContactInfoSection />
                        </div>
                      </div>

                      {/* Passengers */}
                      {passengers && passengers.length > 0 && (
                        <div className="bg-blue-50/30 rounded-lg p-3 border border-blue-100">
                          <PassengersSection
                            passengers={passengers}
                            trips={allTrips}
                            discountTypes={discountTypes}
                            onRemove={handleRemovePassenger}
                            onUpdate={(
                              index: number,
                              field: string,
                              value: unknown,
                            ) => {
                              form.setValue(
                                `passengers.${index}.${field}` as Parameters<
                                  typeof form.setValue
                                >[0],
                                value as Parameters<typeof form.setValue>[1],
                              );
                            }}
                          />
                        </div>
                      )}

                      {/* Vehicles */}
                      {vehicles && vehicles.length > 0 && (
                        <div className="bg-purple-50/30 rounded-lg p-3 border border-purple-100">
                          <VehiclesSection
                            vehicles={vehicles}
                            vehicleClasses={vehicleClasses}
                            onRemove={handleRemoveVehicle}
                            onUpdate={(
                              index: number,
                              field: string,
                              value: unknown,
                            ) => {
                              form.setValue(
                                `vehicles.${index}.${field}` as Parameters<
                                  typeof form.setValue
                                >[0],
                                value as Parameters<typeof form.setValue>[1],
                              );
                            }}
                          />
                        </div>
                      )}

                      {/* Loose Cargos */}
                      {looseCargos && looseCargos.length > 0 && (
                        <div className="bg-amber-50/30 rounded-lg p-3 border border-amber-100">
                          <LooseCargosSection
                            cargos={looseCargos}
                            cargoClasses={cargoClasses}
                            onRemove={handleRemoveCargo}
                            onUpdate={(
                              index: number,
                              field: string,
                              value: unknown,
                            ) => {
                              form.setValue(
                                `looseCargos.${index}.${field}` as Parameters<
                                  typeof form.setValue
                                >[0],
                                value as Parameters<typeof form.setValue>[1],
                              );
                            }}
                          />
                        </div>
                      )}

                      {/* Remarks */}
                      <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                          Additional Details
                        </h3>
                        <div className="space-y-2">
                          <label
                            htmlFor="remarks"
                            className="text-sm font-medium"
                          >
                            Remarks
                          </label>
                          <textarea
                            id="remarks"
                            className="w-full border rounded-md p-2 text-sm min-h-15 resize-none"
                            placeholder="Any special requests or notes..."
                            {...form.register("remarks")}
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.back()}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Review Booking</Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </FormProvider>
            ) : (
              <BookingConfirm
                formData={form.getValues()}
                bookingData={bookingData}
                onBack={() => setStep(1)}
                onConfirm={handleConfirmBooking}
                isPending={isPending}
              />
            )}
          </div>

          {/* Trip Summary Side Panel */}
          <div className="hidden lg:block w-72 shrink-0">
            <TripSummaryPanel bookingData={bookingData} allTrips={allTrips} />
          </div>
        </div>
      </div>
    </div>
  );
}
