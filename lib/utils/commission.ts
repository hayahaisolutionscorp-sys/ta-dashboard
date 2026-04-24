import type { CommissionConfig } from "@/constants/types/booking.types";

export interface CommissionAmounts {
  passengerCommissionAmount: number;
  cargoCommissionAmount: number;
  totalCommissionAmount: number;
}

/**
 * Calculate concrete commission amounts from a CommissionConfig and fare totals.
 * Mirrors the server-side CommissionService.calculateCommissionAmounts() logic.
 * Percentage values are rounded to 2 decimal places.
 */
export function calculateCommissionAmounts(
  config: CommissionConfig,
  passengerTotal: number,
  cargoTotal: number,
): CommissionAmounts {
  const passengerCommissionAmount =
    passengerTotal > 0
      ? config.passengerCommissionType === "percentage"
        ? Math.round(((passengerTotal * config.passengerCommissionValue) / 100) * 100) / 100
        : config.passengerCommissionValue
      : 0;

  const cargoCommissionAmount =
    cargoTotal > 0
      ? config.cargoCommissionType === "percentage"
        ? Math.round(((cargoTotal * config.cargoCommissionValue) / 100) * 100) / 100
        : config.cargoCommissionValue
      : 0;

  return {
    passengerCommissionAmount,
    cargoCommissionAmount,
    totalCommissionAmount: passengerCommissionAmount + cargoCommissionAmount,
  };
}
