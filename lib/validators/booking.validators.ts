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

export const VehicleSchema = z
  .object({
    plateNumber: z.string().min(1, "Plate number is required"),
    make: z.string().optional(),
    modelName: z.string().min(1, "Model name is required"),
    modelYear: z
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .optional(),
    vehicleModelId: z.number().positive("Vehicle model is required").optional(),
    vehicleTypeId: z.number().positive("Vehicle type is required").optional(),
    usesPendingModel: z.boolean(),
    driverId: z.string().min(1, "Driver is required"),
    cargoClassCode: z.string().optional(),
    tripAssignments: z
      .array(VehicleTripAssignmentSchema)
      .min(1, "Vehicle must be assigned to at least one trip"),
  })
  .refine(
    (data) => {
      const hasExistingModel = data.vehicleModelId !== undefined;
      const hasManualEntry =
        data.vehicleTypeId !== undefined &&
        data.make !== undefined &&
        data.make.trim().length > 0;
      return hasExistingModel || hasManualEntry;
    },
    {
      message:
        "Either select an existing vehicle model or provide vehicle type and make for manual entry",
      path: ["vehicleTypeId"],
    },
  );

export const LooseCargoTripAssignmentSchema = z.object({
  tripId: z.string().min(1, "Invalid trip ID"),
});

export const LooseCargoSchema = z.object({
  description: z.string().min(1, "Description is required"),
  weight: z.number().positive("Weight must be greater than 0").optional(),
  volume: z.number().positive().optional(),
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
    contactAddress: z.string().optional(),
    contactMobileNumber: z.string().optional(),
    contactEmail: z.union([z.literal(""), z.string().email()]).optional(),
    voucherCode: z.string().optional(),
    referralCode: z.string().optional(),
    remarks: z.string().optional(),
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
      const passengerIds = data.passengers.map((_, index) => index.toString());
      const invalidVehicles = data.vehicles.filter(
        (vehicle) => !passengerIds.includes(vehicle.driverId),
      );
      return invalidVehicles.length === 0;
    },
    {
      message:
        "All vehicles must have a driver selected from the passengers list",
      path: ["vehicles"],
    },
  );

export type BookingFormData = z.infer<typeof CreateBookingSchema>;
