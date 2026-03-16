/**
 * CreateBookingPage — 2-step booking form for travel agency agents.
 *
 * Step 1 — Form
 *   Renders all booking sections (passengers, vehicles, loose cargos, contact
 *   info, markup/remarks) inside a React Hook Form context validated by
 *   CreateBookingSchema. The "Review Booking" button is only enabled when the
 *   form is fully valid (mode: "onChange"). The TripSummaryPanel sidebar shows
 *   real-time pricing and locks the snapshotId into the form.
 *
 * Step 2 — Confirm
 *   Renders BookingConfirm with a read-only summary of the form data.
 *   On "Confirm", calls useCreateBooking() and redirects to /dashboard/bookings
 *   on success.
 *
 * Data flow:
 *  - useBookingData()        fetches trip/cabin/class metadata for the form
 *  - useRoutesForAgency()    fetches the agency's routes to resolve markup
 *  - useMarkupByAgentAndRoute() fetches the agent's configured markup for the route
 *  - allTrips                flattens departure + return segments into a single array
 *  - watchedFormData         live snapshot passed to TripSummaryPanel for pricing
 *  - formVersion             bumped on pricing-relevant field changes to trigger
 *                            a re-render of watchedFormData without re-running effects
 *
 *
 *
 * This lacks actual online transaction
 */
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBookingData } from "@/hooks/queries/bookings/use-booking-data";
import { useCreateBooking } from "@/hooks/mutations/bookings/use-create-booking";
import { useRoutesForAgency } from "@/hooks/queries/routes/use-routes";
import { useMarkupByAgentAndRoute } from "@/hooks/queries/markup/use-markups";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useBookingFormUiStore } from "@/lib/stores/booking-form-ui.store";
import {
  CreateBookingSchema,
  type BookingFormData,
} from "@/lib/validators/booking.validators";
import type {
  TripSummary,
  BookingFormTrip,
} from "@/constants/types/booking.types";
import PassengersSection from "@/components/features/book/sections/PassengersSection";
import VehiclesSection from "@/components/features/book/sections/VehiclesSection";
import LooseCargosSection from "@/components/features/book/sections/LooseCargosSection";
import ContactInfoSection from "@/components/features/book/sections/ContactInfoSection";
import AdditionalInfoSection from "@/components/features/book/sections/AdditionalInfoSection";
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

  const bookingData = bookingResponse;

  // 2-step flow: 1 = form, 2 = confirm
  const step = useBookingFormUiStore((s) => s.step);
  const setStep = useBookingFormUiStore((s) => s.setStep);
  const bumpPricingVersion = useBookingFormUiStore((s) => s.bumpPricingVersion);
  const pricingVersion = useBookingFormUiStore((s) => s.pricingVersion);
  const resetUiStore = useBookingFormUiStore((s) => s.reset);

  // Reset UI store on unmount
  useEffect(() => {
    return () => resetUiStore();
  }, [resetUiStore]);

  // Flatten departure and return segments into trips array
  const allTrips: BookingFormTrip[] = useMemo(() => {
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
      ...departureSegments.map((trip: TripSummary, index: number) => ({
        ...trip,
        tripType: "departure" as const,
        sequence: index + 1,
        cabins: trip.ship?.cabins ?? [],
      })),
      ...returnSegments.map((trip: TripSummary, index: number) => ({
        ...trip,
        tripType: "return" as const,
        sequence: index + 1,
        cabins: trip.ship?.cabins ?? [],
      })),
    ];
  }, [bookingData]);

  // Fetch the current agent's markup for this route to use as default
  const currentUser = useAuthStore((s) => s.user);
  const { data: agencyRoutes } = useRoutesForAgency(
    currentUser?.travel_agency_id,
  );
  const bookingRouteCode = allTrips[0]?.route_code ?? null;
  const matchedRoute = agencyRoutes?.find(
    (r) => `${r.src_port_code}-${r.dest_port_code}` === bookingRouteCode,
  );
  const { data: agentMarkup } = useMarkupByAgentAndRoute(
    currentUser?.id,
    matchedRoute?.id,
  );
  const defaultMarkup = agentMarkup?.flat_passenger_markup ?? 0;

  // Use options directly from the prepared booking data (client API provides these)
  const derivedOptions = useMemo(() => {
    if (!bookingData) {
      return {
        discountTypes: ["Adult", "Child", "Senior", "Student", "PWD", "Infant"],
        vehicleClasses: [] as Array<{ code: string; display: string }>,
        cargoClasses: [] as Array<{ code: string; display: string }>,
        validAccommodations: new Set<string>(),
        availableCabinTypes: [] as string[],
      };
    }

    // Passenger types come directly from the API
    const discountTypes =
      bookingData.passengerTypes?.length > 0
        ? bookingData.passengerTypes
        : ["Adult", "Child", "Senior", "Student", "PWD", "Infant"];

    // Vehicle and cargo classes come directly from the API (keep full objects for display)
    const vehicleClasses = bookingData.vehicleClasses ?? [];
    const cargoClasses = bookingData.cargoClasses ?? [];

    // Accommodation codes from the API
    const validAccommodations = new Set(bookingData.accommodationCodes ?? []);

    // Derive cabin types from ship data in trips
    const shipCabinTypes = new Set<string>();
    const trips = [
      ...(bookingData.departure ?? []),
      ...(bookingData.return ?? []),
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
      vehicleClasses,
      cargoClasses,
      validAccommodations,
      availableCabinTypes,
    };
  }, [bookingData]);

  const { discountTypes, vehicleClasses, cargoClasses } = derivedOptions;

  // Initialize form
  const form = useForm<BookingFormData>({
    resolver: zodResolver(CreateBookingSchema),
    mode: "onChange",
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
      ta_markup: 0,
      rateSnapshotId: undefined,
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

  // Sync ta_markup form value when the agent's configured markup loads
  useEffect(() => {
    form.setValue("ta_markup", defaultMarkup, { shouldValidate: false });
  }, [defaultMarkup, form]);

  const { watch, handleSubmit } = form;
  const passengers = watch("passengers");
  const vehicles = watch("vehicles");
  const looseCargos = watch("looseCargos");
  const taMarkup = watch("ta_markup");

  // Bump pricingVersion in the UI store whenever a pricing-relevant field changes.
  useEffect(() => {
    const subscription = form.watch((_value: unknown, { name }: { name?: string }) => {
      if (
        name?.includes("discountType") ||
        name?.includes("cabinId") ||
        name?.includes("tripAssignments") ||
        name?.includes("cargoClassCode") ||
        name?.includes("vehicleTypeId") ||
        name?.includes("weight") ||
        name?.includes("quantity")
      ) {
        bumpPricingVersion();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, bumpPricingVersion]);

  // Build a live form snapshot for TripSummaryPanel pricing
  // Re-computes when rows change OR when pricing-relevant fields change
  const watchedFormData = useMemo(() => {
    const data = {
      ...form.getValues(),
      passengers,
      vehicles,
      looseCargos,
      ta_markup: taMarkup,
    };
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengers, vehicles, looseCargos, taMarkup, form, pricingVersion]);

  // Add/remove handlers
  const handleAddPassenger = () => {
    const current = form.getValues("passengers");
    const defaultDiscount =
      discountTypes.find((t) => t.toLowerCase() === "adult") ||
      discountTypes[0] ||
      "Adult";

    const newPassenger = {
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
        return {
          tripId: trip.id,
          cabinId: trip.cabins?.at(0)?.id ?? null,
          cabin_type_name: trip.cabins?.at(0)?.name,
          discountType: defaultDiscount,
        };
      }),
    };

    form.setValue("passengers", [...current, newPassenger]);
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
    const newVehicle = {
      plateNumber: "",
      make: "Toyota",
      modelName: "",
      modelYear: new Date().getFullYear(),
      vehicleModelId: undefined,
      vehicleTypeId: 1,
      usesPendingModel: false,
      driverId: undefined,
      cargoClassCode: "",
      tripAssignments: allTrips.map((trip) => ({
        tripId: trip.id,
      })),
    };
    form.setValue("vehicles", [...current, newVehicle]);
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
    const newCargo = {
      description: "",
      weight: 1,
      quantity: 1,
      cargoClassCode: "",
      tripAssignments: allTrips.map((trip) => ({
        tripId: trip.id,
      })),
    };
    form.setValue("looseCargos", [...current, newCargo]);
  };

  const handleRemoveCargo = (index: number) => {
    const current = form.getValues("looseCargos");
    form.setValue(
      "looseCargos",
      current.filter((_, i) => i !== index),
    );
  };

  const onSubmit: SubmitHandler<BookingFormData> = () => {
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
    });
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
                <form onSubmit={handleSubmit(onSubmit)}>
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
                            trips={allTrips}
                            passengers={(passengers ?? []).map((pax, idx) => ({
                              index: idx,
                              label: pax.firstName
                                ? `${pax.firstName} ${pax.lastName ?? ""}`.trim()
                                : `Passenger ${idx + 1}`,
                            }))}

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
                            trips={allTrips}

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

                      {/* Additional Details (Markup + Remarks) */}
                      <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                        <AdditionalInfoSection defaultMarkup={defaultMarkup} />
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
                        <Button
                          type="submit"
                          disabled={!form.formState.isValid}
                        >
                          Review Booking
                        </Button>
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
            <TripSummaryPanel
              bookingData={bookingData}
              allTrips={allTrips}
              formData={watchedFormData}
              onSnapshotId={(id) => form.setValue("rateSnapshotId", id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
