"use client";

import { useState, useEffect } from "react";
import {
  IconWallet,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconReceipt,
  IconRefresh,
  IconCheck,
  IconCopy,
  IconAlertCircle,
  IconInfoCircle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  useAgentWallet,
  useDepositMethods,
  useEnabledProviders,
  useSplitDepositStatus,
} from "@/hooks/queries/wallet/use-wallet";
import {
  useRequestWithdrawal,
  useCreatePaymongoCheckout,
  useInitiatePaymongoPayment,
  useCreateMayaCheckout,
  useRequestManualDeposit,
  useCreateSplitDeposit,
  useCreateMayaSplitDeposit,
  useUploadDepositProof,
} from "@/hooks/mutations/wallet/use-wallet-mutations";
import type {
  DepositMethodConfig,
  ManualDepositRequest,
  WalletActivity,
} from "@/constants/types/wallet.types";

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function referenceLabel(code: string): string {
  if (code.startsWith("DEP-")) return "Deposit";
  if (code.startsWith("WD-")) return "Withdrawal";
  if (code.startsWith("BOOK-")) return "Booking";
  if (code.startsWith("REF-")) return "Refund";
  if (code.startsWith("REB-")) return "Rebook";
  return code;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Reference code copied to clipboard", {
    description: text,
    duration: 2000,
  });
}

function TransactionRow({ activity }: { activity: WalletActivity }) {
  const isDeposit = activity.transaction_type === "deposit";

  return (
    <TableRow className="group">
      <TableCell className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-7 items-center justify-center rounded-full ${isDeposit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
          >
            {isDeposit ? (
              <IconArrowDownLeft className="size-3.5" />
            ) : (
              <IconArrowUpRight className="size-3.5" />
            )}
          </div>
          <span className="text-sm font-medium">
            {referenceLabel(activity.reference_code)}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-3">
        <div
          className="flex cursor-pointer items-center gap-1.5"
          onClick={() => copyToClipboard(activity.reference_code)}
        >
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
            {activity.reference_code}
          </p>
          <IconCopy className="size-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </TableCell>
      <TableCell className="px-3 py-3 text-right">
        <p className={`text-sm font-semibold ${isDeposit ? "text-green-600" : "text-red-600"}`}>
          {isDeposit ? "+" : "-"}
          {formatCurrency(activity.amount)}
        </p>
      </TableCell>
      <TableCell className="px-3 py-3 text-right">
        {activity.commission_amount != null && activity.commission_amount > 0 ? (
          <p className="text-sm font-medium text-green-600">
            −{formatCurrency(activity.commission_amount)}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="px-3 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(activity.created_at)}
      </TableCell>
    </TableRow>
  );
}

function ManualRequestRow({ request }: { request: ManualDepositRequest }) {
  return (
    <TableRow className="group">
      <TableCell className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted/20 overflow-hidden">
            {request.payment_method === "GCash" ? (
              <img src="/GCash_logo.svg.png" alt="GCash" className="size-full object-contain p-1" />
            ) : request.payment_method === "Bank Transfer" ? (
              <img src="/transference.png" alt="Bank Transfer" className="size-full object-contain p-1" />
            ) : request.payment_method === "Cash" ? (
              <img src="/ayahay-icon.png" alt="Cash" className="size-full object-contain p-1" />
            ) : (
              <IconReceipt className="size-3.5 text-orange-600" />
            )}
          </div>
          <p className="text-sm font-medium">{request.payment_method}</p>
        </div>
      </TableCell>
      <TableCell className="px-3 py-3">
        <div
          className="flex cursor-pointer items-center gap-1.5"
          onClick={() => copyToClipboard(request.user_reference_number ?? "")}
        >
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
            {request.user_reference_number}
          </p>
          <IconCopy className="size-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </TableCell>
      <TableCell className="px-3 py-3 text-right">
        <p className="text-sm font-semibold text-orange-600">
          {formatCurrency(request.amount)}
        </p>
      </TableCell>
      <TableCell className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {request.status === "for_verification" && (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 px-1.5 text-[10px] font-medium text-orange-700"
            >
              Pending
            </Badge>
          )}
          {request.status === "rejected" && (
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="border-red-200 bg-red-50 px-1.5 text-[10px] font-medium text-red-700"
              >
                Rejected
              </Badge>
              {request.rejection_reason && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-700">
                        <IconAlertCircle className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-red-600 text-white border-none text-xs">
                      <p>{request.rejection_reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
          {request.status === "success" && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 px-1.5 text-[10px] font-medium text-green-700"
            >
              Success
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(request.created_at)}
      </TableCell>
    </TableRow>
  );
}

type SplitFormLeg = {
  id: string;
  amount: string;
  methodCode: DepositMethodConfig["code"];
  legType: "instant" | "manual";
  userReferenceNumber?: string;
  proofFile?: File | null;
  proofUrl?: string;
};

function DepositDialog({
  agentId,
  agencyId,
}: {
  agentId: string;
  agencyId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<
    "method" | "amount" | "review" | "split_proposal" | "split_builder" | "split_review" | "processing" | "success"
  >("method");
  const [selectedMethodCode, setSelectedMethodCode] = useState<DepositMethodConfig["code"] | null>(null);
  const [amount, setAmount] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingCountdown, setProcessingCountdown] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [splitLegs, setSplitLegs] = useState<SplitFormLeg[]>([
    {
      id: crypto.randomUUID(),
      amount: "",
      methodCode: "bank_transfer",
      legType: "instant",
      proofFile: null,
    },
  ]);
  
  const { data: enabledProviders, refetch: refetchProviders } = useEnabledProviders();
  const { data: depositMethods, refetch: refetchMethods } = useDepositMethods();
  const createPaymongoCheckout = useCreatePaymongoCheckout();
  const initiatePaymongoPayment = useInitiatePaymongoPayment();
  const createMayaCheckout = useCreateMayaCheckout();
  const requestManualDeposit = useRequestManualDeposit();
  const uploadProof = useUploadDepositProof();
  const createSplitDeposit = useCreateSplitDeposit();
  const createMayaSplitDeposit = useCreateMayaSplitDeposit();

  useEffect(() => {
    if (open) {
      refetchProviders();
      refetchMethods();
      setStep("method");
      setSelectedMethodCode(null);
      setAmount("");
      setRefNumber("");
      setProofFile(null);
      setProcessingMessage("");
      setProcessingCountdown(0);
      setRedirectUrl(null);
      setSplitLegs([
        {
          id: crypto.randomUUID(),
          amount: "",
          methodCode: "bank_transfer",
          legType: "manual",
          proofFile: null,
        },
      ]);
    }
  }, [open, refetchProviders, refetchMethods]);

  const paymongoEnabled = enabledProviders?.some((p) => p.code === "paymongo");
  const mayaEnabled = enabledProviders?.some((p) => p.code === "maya");
  const availableMethods = (depositMethods ?? []).filter((method) => method.is_enabled);

  const selectedMethod = availableMethods.find((method) => method.code === selectedMethodCode) ?? null;

  const isPending = 
    createPaymongoCheckout.isPending || 
    initiatePaymongoPayment.isPending || 
    createMayaCheckout.isPending ||
    requestManualDeposit.isPending ||
    uploadProof.isPending ||
    createSplitDeposit.isPending ||
    createMayaSplitDeposit.isPending;

  const mapMethodCodeToGatewayMethod = (methodCode: DepositMethodConfig["code"]): string => {
    switch (methodCode) {
      case "cards":
        return "card";
      case "grabpay":
        return "grab_pay";
      case "bank_transfer":
        return "Bank Transfer";
      default:
        return methodCode;
    }
  };

  const resolveProviderForMethod = (methodCode: DepositMethodConfig["code"]): {
    provider: "paymongo" | "maya" | null;
    gatewayMethod: string | null;
    paymongoCheckout: boolean;
  } => {
    if (methodCode === "bank_transfer") {
      return {
        provider: null,
        gatewayMethod: null,
        paymongoCheckout: false,
      };
    }

    const gatewayMethod = mapMethodCodeToGatewayMethod(methodCode);

    if (paymongoEnabled && !mayaEnabled) {
      return {
        provider: "paymongo",
        gatewayMethod: "checkout",
        paymongoCheckout: true,
      };
    }

    if (!paymongoEnabled && mayaEnabled) {
      return {
        provider: "maya",
        gatewayMethod,
        paymongoCheckout: false,
      };
    }

    if (paymongoEnabled && mayaEnabled) {
      if (methodCode === "cards") {
        return {
          provider: "maya",
          gatewayMethod: "card",
          paymongoCheckout: false,
        };
      }

      return {
        provider: "paymongo",
        gatewayMethod,
        paymongoCheckout: false,
      };
    }

    return {
      provider: null,
      gatewayMethod: null,
      paymongoCheckout: false,
    };
  };

  const getLegTypeFromMethod = (methodCode: DepositMethodConfig["code"]): "instant" | "manual" =>
    methodCode === "bank_transfer" ? "manual" : "instant";

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: unknown }).response !== null
    ) {
      const response = (error as { response?: { data?: { message?: unknown } } }).response;
      if (typeof response?.data?.message === "string") {
        return response.data.message;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  };

  const buildSplitProposal = (
    totalAmount: number,
    methodCode: DepositMethodConfig["code"],
    splitLimit: number,
  ): SplitFormLeg[] => {
    let remaining = Number(totalAmount.toFixed(2));
    const legs: SplitFormLeg[] = [];

    const selectedMethodType = getLegTypeFromMethod(methodCode);
    const canUseInstant = selectedMethodType === "instant";

    if (canUseInstant) {
      const instantAmount = Math.min(remaining, splitLimit);
      legs.push({
        id: crypto.randomUUID(),
        amount: instantAmount.toFixed(2),
        methodCode,
        legType: "instant",
        proofFile: null,
      });
      remaining = Number((remaining - instantAmount).toFixed(2));
    }

    while (remaining > 0.001 && legs.length < 5) {
      const manualAmount = Math.min(remaining, splitLimit);
      legs.push({
        id: crypto.randomUUID(),
        amount: manualAmount.toFixed(2),
        methodCode: "bank_transfer",
        legType: "manual",
        proofFile: null,
      });
      remaining = Number((remaining - manualAmount).toFixed(2));
    }

    if (remaining > 0.001) {
      throw new Error("Amount is too large for the current split settings. Please reduce amount or contact support.");
    }

    return legs;
  };

  const splitTotalAmount = splitLegs.reduce(
    (sum, leg) => sum + Number(leg.amount || 0),
    0,
  );

  const splitRemainingAmount = Number((Number(amount || 0) - splitTotalAmount).toFixed(2));
  const splitRemainingIsNegative = splitRemainingAmount < 0;
  const splitRemainingIsBalanced = Math.abs(splitRemainingAmount) < 0.005;

  const validateSplitLegs = (): string | null => {
    const instantLegCount = splitLegs.filter((leg) => leg.legType === "instant").length;
    if (instantLegCount > 1) {
      return "Only one instant leg is allowed per split transaction.";
    }

    if (splitLegs.some((leg) => Number(leg.amount || 0) <= 0)) {
      return "All split legs must have an amount greater than zero.";
    }

    if (!splitRemainingIsBalanced) {
      if (splitRemainingIsNegative) {
        return "Remaining balance cannot be negative. Adjust split amounts.";
      }

      return "Remaining balance must be exactly ₱0.00 before continuing.";
    }

    const manualLegMissingReference = splitLegs.some(
      (leg) => leg.legType === "manual" && !leg.userReferenceNumber?.trim(),
    );
    if (manualLegMissingReference) {
      return "Each manual leg requires a reference number.";
    }

    const manualLegMissingProof = splitLegs.some(
      (leg) => leg.legType === "manual" && !leg.proofFile && !leg.proofUrl,
    );
    if (manualLegMissingProof) {
      return "Each manual leg requires a proof upload.";
    }

    return null;
  };

  const handleMethodContinue = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    setStep("amount");
  };

  const handleAmountContinue = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (numAmount < selectedMethod.min_amount || numAmount > selectedMethod.max_amount) {
      toast.error(
        `Amount for ${selectedMethod.name} must be between ${formatCurrency(selectedMethod.min_amount)} and ${formatCurrency(selectedMethod.max_amount)}.`,
      );
      return;
    }

    if (numAmount > selectedMethod.split_limit) {
      try {
        const proposal = buildSplitProposal(numAmount, selectedMethod.code, selectedMethod.split_limit);
        setSplitLegs(proposal);
        setStep("split_proposal");
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to generate split proposal."));
      }
      return;
    }

    setStep("review");
  };

  const handleInstantDeposit = (methodCode: DepositMethodConfig["code"], numAmount: number) => {
    const routing = resolveProviderForMethod(methodCode);
    if (!routing.provider) {
      toast.error("No provider available for selected method.");
      return;
    }

    if (routing.provider === "maya") {
      createMayaCheckout.mutate(
        {
          totalAmount: { value: numAmount, currency: "PHP" },
          items: [{ name: "Wallet Deposit", quantity: 1, amount: { value: numAmount }, totalAmount: { value: numAmount }, description: `Deposit for travel agent ${agentId}` }],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          failureUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => {
            if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
          },
          onError: (err) => {
            console.error("Maya error:", err);
            toast.error(getErrorMessage(err, "Failed to create Maya checkout session."));
          },
        }
      );
      return;
    }

    if (routing.paymongoCheckout) {
      createPaymongoCheckout.mutate(
        {
          lineItems: [{ name: "Wallet Deposit", quantity: 1, amount: Math.round(numAmount * 100), currency: "PHP", description: `Deposit for travel agent ${agentId}` }],
          paymentMethodTypes: ["gcash", "paymaya", "card", "dob", "qrph", "grab_pay"],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => {
            if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
          },
          onError: (err) => {
            console.error("PayMongo error:", err);
            toast.error(getErrorMessage(err, "Failed to create PayMongo checkout session."));
          },
        }
      );
      return;
    }

    if (!routing.gatewayMethod) {
      toast.error("No payment method available for selected provider route.");
      return;
    }

    initiatePaymongoPayment.mutate(
      {
        amount: numAmount,
        paymentMethodType: routing.gatewayMethod,
        returnUrl: `${window.location.origin}/dashboard/wallet?success=true`,
        billing: { name: "Travel Agent", email: "agent@ayahay.com" },
      },
      {
        onSuccess: (data) => {
          if (data?.redirectUrl) window.location.href = data.redirectUrl;
        },
        onError: (err) => {
          console.error("PayMongo error:", err);
          toast.error(getErrorMessage(err, "Failed to initiate PayMongo payment."));
        },
      },
    );
  };

  const handleReviewConfirm = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (selectedMethod.kind === "manual") {
      if (!refNumber.trim()) {
        toast.error("Reference number is required for manual deposits.");
        return;
      }

      if (!proofFile) {
        toast.error("Proof of payment is required for manual deposits.");
        return;
      }

      try {
        const uploadRes = await uploadProof.mutateAsync(proofFile);
        await requestManualDeposit.mutateAsync({
          travel_agent_id: agentId,
          travel_agency_id: agencyId ?? undefined,
          amount: numAmount,
          payment_method: "Bank Transfer",
          user_reference_number: refNumber,
          proof_url: uploadRes.url,
        });

        setProcessingMessage("Manual deposit submitted for verification.");
        setStep("success");
      } catch (error) {
        console.error("Manual deposit error:", error);
        toast.error(getErrorMessage(error, "Failed to submit manual deposit request."));
      }

      return;
    }

    handleInstantDeposit(selectedMethod.code, numAmount);
  };

  const addSplitLeg = () => {
    if (splitLegs.length >= 5) return;

    setSplitLegs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        amount: "",
        methodCode: "bank_transfer",
        legType: "manual",
        proofFile: null,
      },
    ]);
  };

  const removeSplitLeg = (legId: string) => {
    if (splitLegs.length <= 1) return;
    setSplitLegs((prev) => prev.filter((leg) => leg.id !== legId));
  };

  const updateSplitLeg = (legId: string, updates: Partial<SplitFormLeg>) => {
    setSplitLegs((prev) =>
      prev.map((leg) => (leg.id === legId ? { ...leg, ...updates } : leg)),
    );
  };

  const updateSplitLegMethod = (legId: string, methodCode: DepositMethodConfig["code"]) => {
    const targetType = getLegTypeFromMethod(methodCode);
    const currentLeg = splitLegs.find((leg) => leg.id === legId);
    if (!currentLeg) return;

    const hasAnotherInstantLeg =
      targetType === "instant" &&
      splitLegs.some((leg) => leg.id !== legId && leg.legType === "instant");

    if (hasAnotherInstantLeg) {
      toast.error("Only one instant leg is allowed in split payment.");
      return;
    }

    updateSplitLeg(legId, {
      methodCode,
      legType: targetType,
      userReferenceNumber: targetType === "manual" ? currentLeg.userReferenceNumber : undefined,
      proofFile: targetType === "manual" ? currentLeg.proofFile : null,
      proofUrl: targetType === "manual" ? currentLeg.proofUrl : undefined,
    });
  };

  const handleSplitBuilderContinue = () => {
    const validationError = validateSplitLegs();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setStep("split_review");
  };

  const handleSplitSubmit = async () => {
    const baseAmount = Number(amount);
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const validationError = validateSplitLegs();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const preparedLegs = await Promise.all(
        splitLegs.map(async (leg) => {
          if (leg.legType === "manual") {
            const proof = leg.proofFile;
            if (!proof) {
              throw new Error("Manual leg proof is required.");
            }

            const uploadRes = await uploadProof.mutateAsync(proof);

            return {
              amount: Number(leg.amount),
              legType: "manual" as const,
              paymentMethod: "Bank Transfer",
              paymentProvider: undefined,
              userReferenceNumber: leg.userReferenceNumber?.trim(),
              proofUrl: uploadRes.url,
            };
          }

          const routing = resolveProviderForMethod(leg.methodCode);
          if (!routing.provider) {
            throw new Error("No provider available for selected instant leg method.");
          }

          const paymentMethod = routing.paymongoCheckout
            ? "checkout"
            : (routing.gatewayMethod ?? "");

          if (!paymentMethod) {
            throw new Error("No payment method available for selected instant leg method.");
          }

          return {
            amount: Number(leg.amount),
            legType: "instant" as const,
            paymentMethod,
            paymentProvider: routing.provider,
            userReferenceNumber: undefined,
            proofUrl: undefined,
          };
        }),
      );

      const instantLeg = preparedLegs.find((leg) => leg.legType === "instant");
      const hasManualLeg = preparedLegs.some((leg) => leg.legType === "manual");
      const splitMutation = instantLeg?.paymentProvider === "maya"
        ? createMayaSplitDeposit
        : createSplitDeposit;

      const response = await splitMutation.mutateAsync({
        totalAmount: baseAmount,
        legs: preparedLegs,
        successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
      });

      localStorage.setItem("wallet_last_split_tx", response.splitTransactionId);

      if (response.checkoutUrl && instantLeg && hasManualLeg) {
        setRedirectUrl(response.checkoutUrl);
        setProcessingCountdown(3);
        setProcessingMessage("Manual deposit submitted for review. Redirecting to payment now...");
        setStep("processing");
        return;
      }

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      setProcessingMessage("All manual split legs were submitted for review.");
      setStep("success");
    } catch (error) {
      console.error("Split deposit error:", error);
      toast.error(getErrorMessage(error, "Failed to create split deposit."));
    }
  };

  useEffect(() => {
    if (step !== "processing") return;
    if (!redirectUrl) return;
    if (processingCountdown <= 0) {
      window.location.href = redirectUrl;
      return;
    }

    const timer = window.setTimeout(() => {
      setProcessingCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [step, redirectUrl, processingCountdown]);

  const methodIcon = (code: DepositMethodConfig["code"]) => {
    switch (code) {
      case "gcash":
        return "/GCash_logo.svg.png";
      case "paymaya":
        return "/Maya_logo.svg.png";
      case "bank_transfer":
        return "/transference.png";
      case "cards":
        return "/atm-card.png";
      case "grabpay":
        return "/grab-pay-logo-png_seeklogo-371015.png";
      case "qrph":
        return "/QR_Ph_Logo.svg.png";
      default:
        return "/ayahay-icon.png";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconArrowDownLeft className="size-4" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {step === "success" ? "Deposit Submitted" : "Make a Deposit"}
          </DialogTitle>
          <DialogDescription>
            {step === "method" && "Choose your preferred payment method."}
            {step === "amount" && "Enter amount and review method limits before continuing."}
            {step === "review" && "Review your deposit details before confirming."}
            {step === "split_proposal" && "Amount exceeds split limit. Review the system split proposal."}
            {step === "split_builder" && "Adjust split legs, methods, and manual proof/reference details."}
            {step === "split_review" && "Review all split legs before confirming this deposit."}
            {step === "processing" && "Preparing your payment flow..."}
            {step === "success" && "Your deposit request has been recorded successfully."}
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableMethods.map((method) => (
                <button
                  key={method.code}
                  onClick={() => setSelectedMethodCode(method.code)}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:bg-accent/40 ${
                    selectedMethodCode === method.code
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-transparent bg-muted/30"
                  }`}
                >
                  <div className="size-14 rounded-xl bg-white border border-muted p-2.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img src={methodIcon(method.code)} alt={method.name} className="size-full object-contain" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {method.name}
                  </span>
                  {selectedMethodCode === method.code && (
                    <div className="absolute -top-1 -right-1 size-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <IconCheck className="size-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button onClick={handleMethodContinue} disabled={!selectedMethodCode}>
              Continue
            </Button>
          </div>
        )}

        {step === "amount" && selectedMethod && (
          <div className="grid gap-4 py-3">
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p>
                Method: <span className="font-semibold">{selectedMethod.name}</span>
              </p>
              <p>
                Min/Max: <span className="font-semibold">{formatCurrency(selectedMethod.min_amount)} - {formatCurrency(selectedMethod.max_amount)}</span>
              </p>
              <p>
                Split limit: <span className="font-semibold">{formatCurrency(selectedMethod.split_limit)}</span>
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit-amount">Enter Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">₱</span>
                <Input
                  id="deposit-amount"
                  type="number"
                  min={selectedMethod.min_amount}
                  step="0.01"
                  className="pl-7 text-lg font-bold"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("method")}>Back</Button>
              <Button className="flex-1" onClick={handleAmountContinue}>Continue</Button>
            </div>
          </div>
        )}

        {step === "review" && selectedMethod && (
          <div className="grid gap-4 py-3">
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold">{selectedMethod.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Type</span>
                <span className="font-semibold">{selectedMethod.kind === "instant" ? "Instant" : "Pending Review"}</span>
              </div>
            </div>

            {selectedMethod.kind === "manual" && (
              <div className="grid gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="manual-ref">Reference Number</Label>
                  <Input
                    id="manual-ref"
                    placeholder="Enter transaction reference"
                    value={refNumber}
                    onChange={(event) => setRefNumber(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="manual-proof">Proof of Payment</Label>
                  <Input
                    id="manual-proof"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>Back</Button>
              <Button className="flex-1" onClick={handleReviewConfirm} disabled={isPending}>
                {isPending ? "Processing..." : "Confirm Deposit"}
              </Button>
            </div>
          </div>
        )}

        {step === "split_proposal" && (
          <div className="grid gap-4 py-3">
            <div className="rounded-lg border bg-blue-50 border-blue-100 p-3 text-sm">
              <p className="font-semibold text-blue-900">Split Proposal Generated</p>
              <p className="text-blue-800">
                Amount exceeded split limit, so we generated {splitLegs.length} leg{splitLegs.length > 1 ? "s" : ""}.
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              {splitLegs.map((leg, index) => (
                <div key={leg.id} className="flex justify-between text-sm">
                  <span>Leg #{index + 1} ({leg.legType})</span>
                  <span className="font-semibold">{formatCurrency(leg.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>Back</Button>
              <Button className="flex-1" onClick={() => setStep("split_builder")}>Accept and Adjust</Button>
            </div>
          </div>
        )}

        {step === "split_builder" && (
          <div className="grid gap-4 py-3">
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {splitLegs.map((leg, index) => {
                const instantCount = splitLegs.filter((item) => item.legType === "instant").length;
                const disableInstantMethodChoice = leg.legType !== "instant" && instantCount >= 1;

                return (
                  <div key={leg.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Leg #{index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removeSplitLeg(leg.id)}
                        disabled={splitLegs.length <= 1}
                      >
                        <IconTrash className="size-4 text-muted-foreground" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={leg.amount}
                          onChange={(event) => updateSplitLeg(leg.id, { amount: event.target.value })}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Method</Label>
                        <select
                          className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                          value={leg.methodCode}
                          onChange={(event) => {
                            const nextMethod = event.target.value as DepositMethodConfig["code"];

                            if (
                              nextMethod !== "bank_transfer" &&
                              disableInstantMethodChoice
                            ) {
                              toast.error("Only one instant leg is allowed.");
                              return;
                            }

                            updateSplitLegMethod(leg.id, nextMethod);
                          }}
                        >
                          {availableMethods.map((method) => (
                            <option key={method.code} value={method.code}>
                              {method.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {leg.legType === "manual" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Reference Number</Label>
                          <Input
                            value={leg.userReferenceNumber ?? ""}
                            onChange={(event) => updateSplitLeg(leg.id, { userReferenceNumber: event.target.value })}
                            placeholder="Enter reference"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Proof</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              updateSplitLeg(leg.id, {
                                proofFile: event.target.files?.[0] ?? null,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addSplitLeg}
              disabled={splitLegs.length >= 5}
              className="gap-2"
            >
              <IconPlus className="size-4" /> Add leg
            </Button>

            <div className="rounded-lg border p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocated</span>
                <span className="font-medium">{formatCurrency(splitTotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className={`font-medium ${splitRemainingAmount < 0 ? "text-destructive" : splitRemainingAmount === 0 ? "text-green-600" : "text-amber-600"}`}>
                  {formatCurrency(splitRemainingAmount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("split_proposal")}>Back</Button>
              <Button className="flex-1" onClick={handleSplitBuilderContinue}>Review All Legs</Button>
            </div>
          </div>
        )}

        {step === "split_review" && (
          <div className="grid gap-4 py-3">
            <div className="rounded-lg border p-3 space-y-2">
              {splitLegs.map((leg, index) => (
                <div key={leg.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Leg #{index + 1}</span>
                    <span className="font-semibold">{formatCurrency(leg.amount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Method: {availableMethods.find((method) => method.code === leg.methodCode)?.name ?? leg.methodCode} • {leg.legType}
                  </p>
                  {leg.legType === "manual" && (
                    <p className="text-xs text-muted-foreground">
                      Ref: {leg.userReferenceNumber || "-"} • Proof: {leg.proofFile ? "Attached" : "Missing"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("split_builder")}>Back</Button>
              <Button className="flex-1" onClick={handleSplitSubmit} disabled={isPending}>
                {isPending ? "Submitting..." : "Confirm Split Deposit"}
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconRefresh className="size-8 animate-spin" />
            </div>
            <div>
              <p className="text-lg font-bold">Processing Deposit</p>
              <p className="text-sm text-muted-foreground px-8">
                {processingMessage}
              </p>
              {redirectUrl && processingCountdown > 0 && (
                <p className="text-sm font-semibold mt-2">
                  Redirecting in {processingCountdown}s...
                </p>
              )}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <IconReceipt className="size-8" />
            </div>
            <div>
                <p className="text-lg font-bold">Deposit Submitted</p>
                <p className="text-sm text-muted-foreground px-8">
                    {processingMessage || "Your deposit has been submitted and is now pending verification."}
                </p>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
                Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({
  agentId,
  agencyId,
  currentBalance,
}: {
  agentId: string;
  agencyId: number | null;
  currentBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const withdrawMutation = useRequestWithdrawal();

  const numAmount = Number(amount);
  const exceedsBalance = numAmount > currentBalance;

  const handleWithdraw = () => {
    if (numAmount <= 0 || exceedsBalance) return;
    withdrawMutation.mutate(
      {
        amount: numAmount,
      },
      {
        onSuccess: () => {
          setAmount("");
          setOpen(false);
          setSuccessOpen(true);
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <IconArrowUpRight className="size-4" />
            Withdraw
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Submit a withdrawal request. It will be reviewed and processed by
              an admin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="withdraw-amount">Amount (₱)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {exceedsBalance && (
                <p className="text-xs text-destructive">
                  Amount exceeds your current balance of{" "}
                  {formatCurrency(currentBalance)}
                </p>
              )}
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Available balance:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(currentBalance)}
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleWithdraw}
              disabled={
                withdrawMutation.isPending || numAmount <= 0 || exceedsBalance
              }
            >
              {withdrawMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Submitted</DialogTitle>
            <DialogDescription>
              Your withdrawal request has been sent. The admin will email you
              once the request has been approved or rejected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setSuccessOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function WalletPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [successMsg, setSuccessMsg] = useState(false);
  const [canceledMsg, setCanceledMsg] = useState(false);
  const [splitTransactionId, setSplitTransactionId] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [depositPage, setDepositPage] = useState(1);

  const TABLE_PAGE_SIZE = 10;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const splitIdFromQuery = searchParams.get("splitTransactionId");

    if (splitIdFromQuery) {
      setSplitTransactionId(splitIdFromQuery);
      localStorage.setItem("wallet_last_split_tx", splitIdFromQuery);
    } else {
      const savedSplitId = localStorage.getItem("wallet_last_split_tx");
      if (savedSplitId) {
        setSplitTransactionId(savedSplitId);
      }
    }

    if (searchParams.get("success") === "true") {
      setSuccessMsg(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (searchParams.get("canceled") === "true") {
      setCanceledMsg(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const { data: splitStatus } = useSplitDepositStatus(
    splitTransactionId,
    currentUser?.id,
  );

  useEffect(() => {
    if (!splitStatus) return;

    if (["fully_paid", "failed", "cancelled"].includes(splitStatus.status)) {
      localStorage.removeItem("wallet_last_split_tx");
    }
  }, [splitStatus]);

  const { data, isLoading, refetch, isRefetching } = useAgentWallet(currentUser?.id, {
    activityPage,
    activityPageSize: TABLE_PAGE_SIZE,
    depositPage,
    depositPageSize: TABLE_PAGE_SIZE,
    depositStatus: "active",
  });

  useEffect(() => {
    if (successMsg) {
      refetch();
    }
  }, [successMsg, refetch]);

  useEffect(() => {
    if (!splitStatus) return;
    refetch();
  }, [splitStatus?.status, splitStatus?.paid_amount, refetch]);

  const balance = data?.balance;
  const activities = data?.activities?.results ?? [];
  const manualDeposits = data?.manualDeposits?.results ?? [];
  const currentBalance = Number(balance?.balance ?? 0);
  const activityMeta = data?.activities;
  const depositMeta = data?.manualDeposits;

  const pendingRequests = manualDeposits;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {successMsg && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <IconArrowDownLeft className="size-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Payment successful! Your deposit is complete. The exact funds may take a moment to reflect in your wallet balance.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setSuccessMsg(false)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {splitStatus && (
        <div
          className={`rounded-md p-4 border ${
            splitStatus.status === "fully_paid"
              ? "bg-green-50 border-green-200"
              : splitStatus.status === "partial_paid"
                ? "bg-blue-50 border-blue-200"
                : splitStatus.status === "failed"
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <IconInfoCircle className="size-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">
                Split Transaction {splitStatus.reference_code}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {splitStatus.status.replace("_", " ")} | Paid {formatCurrency(splitStatus.paid_amount)} of {formatCurrency(splitStatus.total_amount)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {canceledMsg && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <IconArrowDownLeft className="size-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Payment canceled. Your deposit session was not completed.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setCanceledMsg(false)}
                  className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your wallet balance and transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser?.id && (
            <>
              <DepositDialog
                agentId={currentUser.id}
                agencyId={currentUser.travel_agency_id}
              />
              <WithdrawDialog
                agentId={currentUser.id}
                agencyId={currentUser.travel_agency_id}
                currentBalance={currentBalance}
              />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <IconRefresh
              className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <IconWallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(currentBalance)}
            </div>
            {balance?.last_transaction && (
              <p className="text-xs text-muted-foreground mt-1">
                Last transaction: {formatDate(balance.last_transaction)}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Deposits
            </CardTitle>
            <IconArrowDownLeft className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance?.total_deposits)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance?.transaction_count ?? 0} total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <IconArrowUpRight className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(balance?.total_usage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bookings, withdrawals &amp; fees
            </p>
          </CardContent>
        </Card>
      </div>
        {/* Wallet History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Wallet History</CardTitle>
            <p className="text-xs text-muted-foreground">
              Review transaction activity and manual deposit verification requests.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList
                variant="line"
                className="text-muted-foreground mb-3 h-10 w-full justify-start gap-1 rounded-none border-b p-0"
              >
                <TabsTrigger
                  value="activity"
                  className="h-10 flex-none rounded-none border-0 px-4 text-sm data-[state=active]:text-foreground"
                >
                  Wallet Activity
                  <Badge variant="secondary" className="ml-2">
                    {activityMeta?.total ?? 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="deposits"
                  className="h-10 flex-none rounded-none border-0 px-4 text-sm data-[state=active]:text-foreground"
                >
                  Deposit Requests
                  <Badge variant="secondary" className="ml-2">
                    {depositMeta?.total ?? 0}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="animate-in fade-in-0 duration-200">
                {activities.length === 0 ? (
                  <div className="py-12 text-center text-sm italic text-muted-foreground">
                    No transactions recorded yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3">Transaction</TableHead>
                        <TableHead className="px-3">Reference</TableHead>
                        <TableHead className="px-3 text-right">Amount</TableHead>
                        <TableHead className="px-3 text-right">Commission</TableHead>
                        <TableHead className="px-3 text-right">Requested At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TransactionRow key={activity.id} activity={activity} />
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {activityMeta?.page ?? 1} of {activityMeta?.total_pages ?? 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!activityMeta?.has_prev || isRefetching}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((prev) => prev + 1)}
                      disabled={!activityMeta?.has_next || isRefetching}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deposits" className="animate-in fade-in-0 duration-200">
                {pendingRequests.length === 0 ? (
                  <div className="py-8 text-center text-xs italic text-muted-foreground">
                    No active manual deposits.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3">Method</TableHead>
                        <TableHead className="px-3">Reference</TableHead>
                        <TableHead className="px-3 text-right">Amount</TableHead>
                        <TableHead className="px-3 text-right">Status</TableHead>
                        <TableHead className="px-3 text-right">Requested At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <ManualRequestRow key={request.id} request={request} />
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {depositMeta?.page ?? 1} of {depositMeta?.total_pages ?? 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!depositMeta?.has_prev || isRefetching}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositPage((prev) => prev + 1)}
                      disabled={!depositMeta?.has_next || isRefetching}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
