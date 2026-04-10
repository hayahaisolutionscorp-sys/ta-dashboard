"use client";

import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { IconWallet, IconCreditCard, IconAlertCircle } from "@tabler/icons-react";
import { useAgencyWallet } from "@/hooks/queries/wallet/use-wallet";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { BookingFormData } from "@/lib/validators/booking.validators";

interface PaymentMethodSectionProps {
  /**
   * The ticket price the TA owes — pricing.grandTotal from the API,
   * which excludes ta_markup (the TA's own markup is their revenue, not a cost).
   */
  payableAmount?: number;
  /** Commission discount applied by the tenant for this route/agency. */
  commissionAmount?: number;
}

export default function PaymentMethodSection({
  payableAmount = 0,
  commissionAmount = 0,
}: PaymentMethodSectionProps) {
  const { setValue, watch } = useFormContext<BookingFormData>();
  const currentUser = useAuthStore((s) => s.user);
  const { data: walletData, isLoading: isWalletLoading } = useAgencyWallet(
    currentUser?.travel_agency_id,
  );

  const selectedMethod = watch("paymentMethod");
  const balance = walletData?.balance?.balance ?? 0;
  const netPayable = payableAmount > 0 && commissionAmount > 0
    ? Math.max(0, payableAmount - commissionAmount)
    : payableAmount;
  const hasInsufficientBalance = netPayable > 0 && balance < netPayable;

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Payment Method
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Wallet Credit */}
        <button
          type="button"
          disabled={hasInsufficientBalance}
          onClick={() => !hasInsufficientBalance && setValue("paymentMethod", "TA-WALLET", { shouldValidate: true })}
          className={[
            "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
            hasInsufficientBalance
              ? "cursor-not-allowed opacity-60 border-gray-200 bg-gray-50"
              : selectedMethod === "TA-WALLET"
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer",
          ].join(" ")}
        >
          <div
            className={[
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              selectedMethod === "TA-WALLET" && !hasInsufficientBalance
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-500",
            ].join(" ")}
          >
            <IconWallet className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Wallet Credit</span>
              {selectedMethod === "TA-WALLET" && !hasInsufficientBalance && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500">
                  Selected
                </Badge>
              )}
            </div>

            {isWalletLoading ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Loading balance...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Balance:{" "}
                <span
                  className={
                    hasInsufficientBalance
                      ? "text-red-500 font-medium"
                      : "text-green-600 font-medium"
                  }
                >
                  {formatCurrency(balance)}
                </span>
              </p>
            )}

            {hasInsufficientBalance && (
              <div className="flex items-center gap-1 mt-1">
                <IconAlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                <p className="text-[11px] text-red-500">
                  Insufficient balance. Please top up your wallet.
                </p>
              </div>
            )}
          </div>
        </button>

        {/* PayMongo — scaffolding only, not yet active */}
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-not-allowed opacity-60">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <IconCreditCard className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Online Payment
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Coming Soon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              PayMongo integration in progress
            </p>
          </div>
        </div>
      </div>

      {payableAmount > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Wallet deduction:{" "}
          <span className="font-semibold text-gray-700">
            {formatCurrency(payableAmount)}
          </span>
        </p>
      )}
    </div>
  );
}
