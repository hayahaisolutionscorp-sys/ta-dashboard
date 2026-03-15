/**
 * Booking form validation schemas (Zod).
 *
 * Schema hierarchy:
 *  TripAssignmentSchema      — per-trip cabin + discount type selection for a passenger
 *  PassengerSchema           — individual passenger fields + trip assignments
 *  TripSchema                — departure/return trip reference stored in form state
 *  VehicleTripAssignmentSchema — trip reference for a vehicle
 *  VehicleSchema             — vehicle fields + trip assignments (supports round-trip toggle)
 *  LooseCargoTripAssignmentSchema — trip reference for a loose cargo item
 *  LooseCargoSchema          — loose cargo fields + trip assignments
 *
 *  CreateBookingSchema       — root schema combining all of the above, with two
 *                              cross-field refinements:
 *    1. At least one passenger, vehicle, or cargo item must be present.
 *    2. If a vehicle has a driverId set, it must reference a valid passenger index.
 *
 * BookingFormData            — TypeScript type inferred from CreateBookingSchema.
 */
import { z } from "zod";

export const TripAssignmentSchema = z.object({
  tripId: z.string().min(1, "Invalid trip ID"),
  cabinId: z.number().positive("Please select a cabin").nullable(),
  discountType: z.string().min(1, "Please select a passenger type"),
});

export const PassengerSchema = z.object({
  firstName: z.string().min(1, "Enter first name"),
  lastName: z.string().min(1, "Enter last name"),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  sex: z.enum(["male", "female"]),
  birthday: z.date({ message: "Date of birth is required" }),
  address: z.string().optional(),
  nationality: z.string().min(1, "Nationality is required"),
  occupation: z.string().optional(),
  civilStatus: z.string().optional(),
  mobileNumber: z.string().optional(),
  tripAssignments: z
    .array(TripAssignmentSchema)
    .min(1, "Passenger must be assigned to at least one trip"),
});

export const TripSchema = z.object({
  tripType: z.enum(["departure", "return"]),
  sequence: z.number().positive(),
  tripId: z.string().min(1, "Invalid trip ID"),
});

export const VehicleTripAssignmentSchema = z.object({
  tripId: z.string().min(1, "Invalid trip ID"),
});

export const VehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  make: z.string().optional(),
  modelName: z.string().optional(),
  modelYear: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  vehicleModelId: z.number().positive("Vehicle model is required").optional(),
  vehicleTypeId: z.number().positive("Vehicle type is required").optional(),
  usesPendingModel: z.boolean(),
  driverId: z.string().optional(),
  cargoClassCode: z.string().optional(),
  tripAssignments: z
    .array(VehicleTripAssignmentSchema)
    .min(1, "Vehicle must be assigned to at least one trip"),
});

export const LooseCargoTripAssignmentSchema = z.object({
  tripId: z.string().min(1, "Invalid trip ID"),
});

export const LooseCargoSchema = z.object({
  description: z.string().min(1, "Description is required"),
  weight: z.number().positive("Weight must be greater than 0").optional(),
  volume: z.number().positive().optional(),
  declaredValue: z.number().nonnegative().optional(),
  packageType: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  cargoClassCode: z.string().optional(),
  tripAssignments: z
    .array(LooseCargoTripAssignmentSchema)
    .min(1, "Cargo must be assigned to at least one trip"),
});

export const CreateBookingSchema = z
  .object({
    bookingType: z.enum(["Round Trip", "Single"]),
    trips: z.array(TripSchema).min(1, "Select at least one trip"),
    passengers: z.array(PassengerSchema),
    vehicles: z.array(VehicleSchema),
    looseCargos: z.array(LooseCargoSchema),
    consignee: z.string().optional(),
    contactAddress: z.string().min(1, "Contact address is required"),
    contactMobileNumber: z.string().min(1, "Contact mobile number is required"),
    contactEmail: z.string().email("Invalid contact email").min(1, "Contact email is required"),
    voucherCode: z.string().optional(),
    referralCode: z.string().optional(),
    remarks: z.string().optional(),
    ta_markup: z.number().nonnegative("Markup must be 0 or greater").optional(),
    rateSnapshotId: z.number().optional(),
  })
  .refine(
    (data) => {
      return (
        data.passengers.length > 0 ||
        data.vehicles.length > 0 ||
        data.looseCargos.length > 0
      );
    },
    {
      message:
        "Booking must contain at least one passenger, vehicle, or cargo item",
      path: ["passengers"],
    },
  )
  .refine(
    (data) => {
      if (data.vehicles.length === 0) return true;
      const passengerIndices = data.passengers.map((_, index) =>
        index.toString(),
      );
      const vehiclesWithDriver = data.vehicles.filter(
        (vehicle) =>
          vehicle.driverId !== undefined &&
          vehicle.driverId !== null &&
          vehicle.driverId !== "",
      );
      const invalidVehicles = vehiclesWithDriver.filter(
        (vehicle) => !passengerIndices.includes(vehicle.driverId!),
      );
      return invalidVehicles.length === 0;
    },
    {
      message:
        "One or more vehicles have a driver that doesn't match a valid passenger. Leave the driver field empty or select a valid passenger.",
      path: ["vehicles"],
    },
  );

export type BookingFormData = z.infer<typeof CreateBookingSchema>;
