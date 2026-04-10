"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconUser, IconPackage, IconWallet, IconTag } from "@tabler/icons-react";
import type { CommissionConfig } from "@/constants/types/booking.types";
import { calculateCommissionAmounts } from "@/lib/utils/commission";

interface CommissionBreakdownModalProps {
  open: boolean;
  commissionConfig: CommissionConfig;
  /** Sum of all passenger base fares for the booking */
  passengerTotal: number;
  /** Sum of all cargo base fares for the booking */
  cargoTotal: number;
  /** Grand total (base + charges + taxes, excludes ta_markup) — what the TA owes before commission */
  grandTotal: number;
  /** Total surcharges from pricing */
  chargesTotal?: number;
  /** Total taxes from pricing */
  taxesTotal?: number;
  onBack: () => void;
  onConfirm: () => void;
}

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function commissionLabel(type: "fixed" | "percentage", value: number): string {
  return type === "percentage" ? `${value}%` : "Fixed";
}

export default function CommissionBreakdownModal({
  open,
  commissionConfig,
  passengerTotal,
  cargoTotal,
  grandTotal,
  chargesTotal = 0,
  taxesTotal = 0,
  onBack,
  onConfirm,
}: CommissionBreakdownModalProps) {
  const { passengerCommissionAmount, cargoCommissionAmount, totalCommissionAmount } =
    calculateCommissionAmounts(commissionConfig, passengerTotal, cargoTotal);

  const netDeduction = Math.max(0, grandTotal - totalCommissionAmount);
  const hasPassengerCommission =
    commissionConfig.passengerCommissionValue > 0 && passengerTotal > 0;
  const hasCargoCommission =
    commissionConfig.cargoCommissionValue > 0 && cargoTotal > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onBack()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconWallet className="h-5 w-5 text-blue-600" />
            Payment Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Passengers */}
          {passengerTotal > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <IconUser className="h-4 w-4 text-blue-500" />
                Passengers
              </div>
              <div className="ml-5 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fare total</span>
                  <span>{formatCurrency(passengerTotal)}</span>
                </div>
                {hasPassengerCommission && (
                  <div className="flex justify-between text-sm text-green-600">
                    <div className="flex items-center gap-1">
                      <IconTag className="h-3.5 w-3.5" />
                      <span>
                        Commission (
                        {commissionLabel(
                          commissionConfig.passengerCommissionType,
                          commissionConfig.passengerCommissionValue,
                        )}
                        )
                      </span>
                    </div>
                    <span>−{formatCurrency(passengerCommissionAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cargo */}
          {cargoTotal > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <IconPackage className="h-4 w-4 text-amber-500" />
                Cargo
              </div>
              <div className="ml-5 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fare total</span>
                  <span>{formatCurrency(cargoTotal)}</span>
                </div>
                {hasCargoCommission && (
                  <div className="flex justify-between text-sm text-green-600">
                    <div className="flex items-center gap-1">
                      <IconTag className="h-3.5 w-3.5" />
                      <span>
                        Commission (
                        {commissionLabel(
                          commissionConfig.cargoCommissionType,
                          commissionConfig.cargoCommissionValue,
                        )}
                        )
                      </span>
                    </div>
                    <span>−{formatCurrency(cargoCommissionAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Surcharges & Taxes */}
          {(chargesTotal > 0 || taxesTotal > 0) && (
            <div className="space-y-1 ml-5">
              {chargesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Surcharges</span>
                  <span>{formatCurrency(chargesTotal)}</span>
                </div>
              )}
              {taxesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>{formatCurrency(taxesTotal)}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Net deduction */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Net Wallet Deduction</span>
            <span
              className={`text-base font-bold ${totalCommissionAmount > 0 ? "text-green-700" : "text-gray-900"}`}
            >
              {formatCurrency(netDeduction)}
            </span>
          </div>

          {totalCommissionAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              You save{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(totalCommissionAmount)}
              </span>{" "}
              in commission discounts on this booking.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to Edit
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm & Create Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
