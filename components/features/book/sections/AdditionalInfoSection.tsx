"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BookingFormData } from "@/lib/validators/booking.validators";
import { IconPencil, IconPencilOff } from "@tabler/icons-react";

interface AdditionalInfoSectionProps {
  /** Default markup amount pre-filled for this TA/route (0 if none configured) */
  defaultMarkup?: number;
}

export default function AdditionalInfoSection({
  defaultMarkup = 0,
}: AdditionalInfoSectionProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<BookingFormData>();

  const [isOverriding, setIsOverriding] = useState(false);
  const currentMarkup = watch("ta_markup");

  const handleToggleOverride = () => {
    if (isOverriding) {
      // Revert to default
      setValue("ta_markup", defaultMarkup, { shouldValidate: true });
      setIsOverriding(false);
    } else {
      setIsOverriding(true);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Additional Details
      </h3>

      {/* TA Markup */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ta_markup" className="text-sm font-medium">
            Agent Markup
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={handleToggleOverride}
          >
            {isOverriding ? (
              <>
                <IconPencilOff className="h-3.5 w-3.5" />
                Reset to Default
              </>
            ) : (
              <>
                <IconPencil className="h-3.5 w-3.5" />
                Override
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">₱</span>
          <Input
            id="ta_markup"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="h-8 text-sm w-32"
            disabled={!isOverriding}
            {...register("ta_markup", { valueAsNumber: true })}
          />
          {!isOverriding &&
            currentMarkup !== undefined &&
            currentMarkup > 0 && (
              <span className="text-xs text-muted-foreground">(default)</span>
            )}
          {isOverriding && (
            <span className="text-xs text-amber-600 font-medium">
              (overridden)
            </span>
          )}
        </div>

        {errors.ta_markup && (
          <p className="text-xs text-red-500">{errors.ta_markup.message}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Additional markup amount added on top of the base fare for this
          booking.
        </p>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-sm font-medium">
          Remarks
        </Label>
        <textarea
          id="remarks"
          className="w-full border rounded-md p-2 text-sm min-h-15 resize-none"
          placeholder="Any special requests or notes..."
          {...register("remarks")}
        />
      </div>
    </div>
  );
}
