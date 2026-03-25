"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormData } from "@/lib/validators/booking.validators";

export default function ContactInfoSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BookingFormData>();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Contact Information
      </h3>

      <div className="space-y-2">
        <div>
          <Label htmlFor="contactAddress" className="text-xs">
            Address *
          </Label>
          <Input
            id="contactAddress"
            placeholder="Contact address"
            className="h-8 text-sm"
            {...register("contactAddress")}
          />
          {errors.contactAddress && (
            <p className="text-xs text-red-500 mt-1">
              {errors.contactAddress.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="contactMobileNumber" className="text-xs">
            Mobile Number *
          </Label>
          <Input
            id="contactMobileNumber"
            placeholder="e.g. 09171234567"
            className="h-8 text-sm"
            {...register("contactMobileNumber")}
          />
          {errors.contactMobileNumber && (
            <p className="text-xs text-red-500 mt-1">
              {errors.contactMobileNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="contactEmail" className="text-xs">
            Email *
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="email@example.com"
            className="h-8 text-sm"
            {...register("contactEmail")}
          />
          {errors.contactEmail && (
            <p className="text-xs text-red-500 mt-1">
              {errors.contactEmail.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
