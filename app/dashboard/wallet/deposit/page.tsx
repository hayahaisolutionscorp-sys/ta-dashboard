"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconRefresh,
  IconCheck,
  IconTrash,
  IconShieldLock,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";


import { useAuthStore } from "@/lib/stores/auth.store";
import {
  useDepositMethods,
  useEnabledProviders,
} from "@/hooks/queries/wallet/use-wallet";
import {
  useCreatePaymongoCheckout,
  useInitiatePaymongoPayment,
  useCreateMayaCheckout,
  useRequestManualDeposit,
  useCreateSplitDeposit,
  useCreateMayaSplitDeposit,
  useUploadDepositProof,
} from "@/hooks/mutations/wallet/use-wallet-mutations";
import type { DepositMethodConfig, EnabledPaymentMethod } from "@/constants/types/wallet.types";


// --- Constants ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};


const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "circOut",
    },
  },
};



function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type SplitFormTranche = {
  id: string;
  amount: string;
  methodCode: DepositMethodConfig["code"] | "";
  trancheType: "instant" | "manual" | "";
  userReferenceNumber?: string;
  proofFile?: File | null;
  proofUrl?: string;
};

const methodIcon = (code: string) => {
  switch (code) {
    case "gcash":
    case "gcash_manual":
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


function DepositPageContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const currentUser = useAuthStore((s) => s.user);

  const [paymentChoice, setPaymentChoice] = useState<"single" | "split">(typeParam === "split" ? "split" : "single");
  const [stepId, setStepId] = useState<"form" | "processing" | "success">("form");

  const [selectedMethodCode, setSelectedMethodCode] = useState<DepositMethodConfig["code"] | null>(null);
  const [selectedProviderMethodCode, setSelectedProviderMethodCode] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [splitTranches, setSplitTranches] = useState<SplitFormTranche[]>(
    typeParam === "split" ? [
      { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "", proofFile: null },
      { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "", proofFile: null }
    ] : []
  );

  const [processingMessage, setProcessingMessage] = useState("");
  const [processingCountdown, setProcessingCountdown] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const { data: enabledProviders } = useEnabledProviders();
  const { data: depositMethods } = useDepositMethods();

  const createPaymongoCheckout = useCreatePaymongoCheckout();
  const initiatePaymongoPayment = useInitiatePaymongoPayment();
  const createMayaCheckout = useCreateMayaCheckout();
  const requestManualDeposit = useRequestManualDeposit();
  const uploadProof = useUploadDepositProof();
  const createSplitDeposit = useCreateSplitDeposit();
  const createMayaSplitDeposit = useCreateMayaSplitDeposit();

  useEffect(() => {
    if (typeParam === "split") {
      setPaymentChoice("split");
      if (splitTranches.length === 0) {
        setSplitTranches([
          { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "manual", proofFile: null },
          { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "manual", proofFile: null }
        ]);
      }
    } else {
      setPaymentChoice("single");
    }
  }, [typeParam]);

  const paymongoEnabled = enabledProviders?.some((p) => p.code === "paymongo");
  const mayaEnabled = enabledProviders?.some((p) => p.code === "maya");

  const allProviderMethods: EnabledPaymentMethod[] = (enabledProviders ?? []).flatMap((p) => p.methods ?? []);
  const hasProviderMethods = allProviderMethods.length > 0;

  const availableMethods: DepositMethodConfig[] = [
    ...(depositMethods ?? []).filter((method) => method.is_enabled && method.code !== "cash"),
  ].filter((method, index, self) => index === self.findIndex((m) => m.code === method.code));

  const splitOnlyMethods: DepositMethodConfig[] = [
    { code: "bank_transfer", name: "Bank Transfer", kind: "manual", min_amount: 1, max_amount: 1000000, split_limit: 5, requires_reference: true, requires_proof: true, is_enabled: true, provider_code: null, gateway_method: null },
    { code: "gcash", name: "GCash", kind: "manual", min_amount: 1, max_amount: 100000, split_limit: 5, requires_reference: true, requires_proof: true, is_enabled: true, provider_code: null, gateway_method: null },
    { code: "paymaya", name: "Maya", kind: "manual", min_amount: 1, max_amount: 100000, split_limit: 5, requires_reference: true, requires_proof: true, is_enabled: true, provider_code: null, gateway_method: null },
  ];

  const splitAvailableMethods = splitOnlyMethods;

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
      case "cards": return "card";
      case "grabpay": return "grab_pay";
      case "bank_transfer": return "dob";
      default: return methodCode;
    }
  };

  const resolveProviderForMethod = (methodCode: DepositMethodConfig["code"]): {
    provider: "paymongo" | "maya" | null;
    gatewayMethod: string | null;
    paymongoCheckout: boolean;
  } => {
    const gatewayMethod = mapMethodCodeToGatewayMethod(methodCode);
    if (paymongoEnabled && !mayaEnabled) {
      return { provider: "paymongo", gatewayMethod: "checkout", paymongoCheckout: true };
    }
    if (!paymongoEnabled && mayaEnabled) {
      return { provider: "maya", gatewayMethod, paymongoCheckout: false };
    }
    if (paymongoEnabled && mayaEnabled) {
      if (methodCode === "cards") {
        return { provider: "maya", gatewayMethod: "card", paymongoCheckout: false };
      }
      return { provider: "paymongo", gatewayMethod, paymongoCheckout: false };
    }
    return { provider: null, gatewayMethod: null, paymongoCheckout: false };
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const response = (error as { response?: { data?: { message?: unknown } } }).response;
      if (typeof response?.data?.message === "string") return response.data.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const splitTotalAmount = splitTranches.reduce((sum, tranche) => sum + Number(tranche.amount || 0), 0);
  const splitRemainingAmount = Number((Number(amount || 0) - splitTotalAmount).toFixed(2));
  const splitRemainingIsBalanced = Math.abs(splitRemainingAmount) < 0.005;
  const splitRemainingIsNegative = splitRemainingAmount < 0;

  const validateSplitTranches = (): string | null => {
    const instantTrancheCount = splitTranches.filter((tranche) => tranche.trancheType === "instant").length;
    if (instantTrancheCount > 1) return "Only one instant tranche is allowed per split transaction.";
    if (splitTranches.some((tranche) => Number(tranche.amount || 0) <= 0)) return "All split tranches must have an amount greater than zero.";
    if (splitTranches.some((tranche) => !tranche.methodCode)) return "Each tranche must have a payment method selected.";
    if (!splitRemainingIsBalanced) {
      if (splitRemainingIsNegative) return "Remaining balance cannot be negative. Adjust split amounts.";
      return "Remaining balance must be exactly ₱0.00 before continuing.";
    }

    for (const tranche of splitTranches) {
      if (tranche.methodCode) {
        const method = availableMethods.find(m => m.code === tranche.methodCode);
        if (method) {
          const trancheAmount = Number(tranche.amount || 0);
          if (trancheAmount < method.min_amount) return `Amount for ${method.name} must be at least ${formatCurrency(method.min_amount)}.`;
          if (trancheAmount > method.max_amount) return `Amount for ${method.name} cannot exceed ${formatCurrency(method.max_amount)}.`;
          if (method.split_limit && trancheAmount > method.split_limit) return `Split tranche amount for ${method.name} cannot exceed its split limit of ${formatCurrency(method.split_limit)}.`;
        }
      }
    }

    const manualTrancheMissingReference = splitTranches.some((tranche) => tranche.trancheType === "manual" && !tranche.userReferenceNumber?.trim());
    if (manualTrancheMissingReference) return "Each manual tranche requires a reference number.";
    const manualTrancheMissingProof = splitTranches.some((tranche) => tranche.trancheType === "manual" && !tranche.proofFile && !tranche.proofUrl);
    if (manualTrancheMissingProof) return "Each manual tranche requires a proof upload.";
    return null;
  };

  const handleInstantDeposit = (methodCode: DepositMethodConfig["code"], numAmount: number) => {
    if (!currentUser) return;
    const routing = resolveProviderForMethod(methodCode);
    if (!routing.provider) {
      toast.error("No provider available for selected method.");
      return;
    }

    if (routing.provider === "maya") {
      createMayaCheckout.mutate(
        {
          totalAmount: { value: numAmount, currency: "PHP" },
          items: [{ name: "Wallet Deposit", quantity: 1, amount: { value: numAmount }, totalAmount: { value: numAmount }, description: `Deposit for travel agent ${currentUser.id}` }],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          failureUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => { if (data?.checkoutUrl) window.location.href = data.checkoutUrl; },
          onError: (err) => { toast.error(getErrorMessage(err, "Failed to create Maya checkout session.")); },
        }
      );
      return;
    }

    if (routing.paymongoCheckout) {
      createPaymongoCheckout.mutate(
        {
          lineItems: [{ name: "Wallet Deposit", quantity: 1, amount: Math.round(numAmount * 100), currency: "PHP", description: `Deposit for travel agent ${currentUser.id}` }],
          paymentMethodTypes: ["gcash", "paymaya", "card", "dob", "qrph", "grab_pay"],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => { if (data?.checkoutUrl) window.location.href = data.checkoutUrl; },
          onError: (err) => { toast.error(getErrorMessage(err, "Failed to create PayMongo checkout session.")); },
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
        onSuccess: (data) => { if (data?.redirectUrl) window.location.href = data.redirectUrl; },
        onError: (err) => { toast.error(getErrorMessage(err, "Failed to initiate PayMongo payment.")); },
      }
    );
  };

  const handleConfirmPayment = async () => {
    if (!currentUser) return;
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }

    if (paymentChoice === "single") {
      if (hasProviderMethods) {
        if (!selectedProviderMethodCode) {
          toast.error("Please select a payment method.");
          return;
        }
        const routingCode = (selectedMethodCode ?? selectedProviderMethodCode) as DepositMethodConfig["code"];
        handleInstantDeposit(routingCode, numAmount);
        return;
      }
      if (!selectedMethod) {
        toast.error("Please select a payment method.");
        return;
      }
      if (numAmount < selectedMethod.min_amount) {
        toast.error(`Minimum amount is ${formatCurrency(selectedMethod.min_amount)}`);
        return;
      }
      if (numAmount > selectedMethod.max_amount) {
        toast.error(`Maximum amount is ${formatCurrency(selectedMethod.max_amount)}`);
        return;
      }
      handleInstantDeposit(selectedMethod.code, numAmount);
    } else {
      const validationError = validateSplitTranches();
      if (validationError) {
        toast.error(validationError);
        return;
      }
      try {
        const preparedTranches = await Promise.all(
          splitTranches.map(async (tranche) => {
              const proof = tranche.proofFile;
              if (!proof) throw new Error("Manual tranche proof is required.");
              const uploadRes = await uploadProof.mutateAsync(proof);
              return {
                amount: Number(tranche.amount),
                legType: "manual" as const,
                paymentMethod: 
                  tranche.methodCode === "bank_transfer" ? "Bank Transfer" : 
                  tranche.methodCode === "paymaya" ? "Maya" : "GCash",
                paymentProvider: undefined,
                userReferenceNumber: tranche.userReferenceNumber?.trim(),
                proofUrl: uploadRes.url,
              };
            })
        );
        const hasManualTranche = preparedTranches.some((tranche) => tranche.legType === "manual");
        const response = await createSplitDeposit.mutateAsync({
          totalAmount: numAmount,
          legs: preparedTranches,
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        });

        localStorage.setItem("wallet_last_split_tx", response.splitTransactionId);
        if (response.checkoutUrl && hasManualTranche) {
          setRedirectUrl(response.checkoutUrl);
          setProcessingCountdown(3);
          setProcessingMessage("Manual deposit submitted for review. Redirecting to payment now...");
          setStepId("processing");
          return;
        }
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }
        setProcessingMessage("All manual split tranches were submitted for review.");
        setStepId("success");
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to create split deposit."));
      }
    }
  };

  useEffect(() => {
    if (stepId !== "processing") return;
    if (!redirectUrl) return;
    if (processingCountdown <= 0) {
      window.location.href = redirectUrl;
      return;
    }
    const timer = window.setTimeout(() => {
      setProcessingCountdown((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [stepId, redirectUrl, processingCountdown]);

  const addSplitTranche = () => {
    if (splitTranches.length >= 5) {
      toast.error("Maximum of 5 tranches allowed.");
      return;
    }
    if (splitRemainingIsBalanced || splitRemainingIsNegative) {
      toast.error("Target amount already reached. No more tranches needed.");
      return;
    }
    setSplitTranches((prev) => [
      ...prev,
      { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "manual", proofFile: null },
    ]);
  };

  const removeSplitTranche = (trancheId: string) => {
    if (splitTranches.length <= 1) return;
    setSplitTranches((prev) => prev.filter((tranche) => tranche.id !== trancheId));
  };

  const updateSplitTranche = (trancheId: string, updates: Partial<SplitFormTranche>) => {
    setSplitTranches((prev) => prev.map((tranche) => (tranche.id === trancheId ? { ...tranche, ...updates } : tranche)));
  };

  const onTabChange = (val: "single" | "split") => {
    setPaymentChoice(val);
    if (val === "split" && splitTranches.length === 0) {
      setSplitTranches([
        { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "manual", proofFile: null },
        { id: crypto.randomUUID(), amount: "", methodCode: "", trancheType: "manual", proofFile: null }
      ]);
    }
  };

  if (stepId === "success") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="border-border/50 shadow-2xl">
            <CardContent className="py-12 text-center space-y-6">
              <div className="mx-auto size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <IconCheck className="size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Deposit Successful</h3>
                <p className="text-muted-foreground text-sm">
                  {processingMessage || "Your deposit request has been submitted successfully."}
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard/wallet")} className="w-full h-11 text-sm font-semibold">
                Return to Wallet
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (stepId === "processing") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-border/50">
            <CardContent className="py-8 text-center space-y-4">
              <IconRefresh className="mx-auto size-10 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="font-semibold text-lg">Processing Transaction</p>
                <p className="text-sm text-muted-foreground">{processingMessage}</p>
                {redirectUrl && processingCountdown > 0 && (
                  <p className="text-xs font-medium text-primary mt-4">
                    Redirecting in {processingCountdown}s...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full flex flex-col md:flex-row p-6 gap-8 items-start overflow-hidden"
    >
      {/* Left Column: Summary */}
      <motion.div variants={itemVariants} className="w-full md:w-80 h-full overflow-y-auto px-1 pr-2 shrink-0 custom-scrollbar">
        <div className="space-y-6 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Deposit</h1>
            <p className="text-muted-foreground text-xs">
              Top up your wallet to gain instant access to platform services.
            </p>
          </div>

        <Card className="border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-[2px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {paymentChoice === "single" ? "Summary" : "Allocation Summary"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Amount</span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(amount || 0)}
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Badge 
                  variant={paymentChoice === 'single' 
                    ? (amount ? 'default' : 'outline') 
                    : (splitRemainingIsBalanced ? 'default' : splitRemainingIsNegative ? 'destructive' : 'secondary')
                  }
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                >
                  {paymentChoice === 'single'
                    ? (amount ? 'Ready' : 'Pending')
                    : (splitRemainingIsBalanced ? 'Balanced' : splitRemainingIsNegative ? 'Excess' : 'Allocating')}
                </Badge>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={paymentChoice}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {paymentChoice === "single" ? (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Method</span>
                          <span className="font-semibold text-foreground">
                            {selectedMethod ? selectedMethod.name : "None selected"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Service Fee</span>
                          <span className="text-muted-foreground">₱0.00</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {splitTranches.map((tranche, i) => {
                            const m = splitAvailableMethods.find(x => x.code === tranche.methodCode);
                            const isComplete = tranche.amount && tranche.methodCode;
                            return (
                              <div key={tranche.id} className="flex justify-between items-center text-[11px]">
                                <span className={cn("font-medium", isComplete ? "text-foreground" : "text-muted-foreground/60")}>
                                  {m ? m.name : `Leg ${i+1}`}
                                </span>
                                <span className={cn("tabular-nums font-semibold", isComplete ? "text-foreground" : "text-muted-foreground/40")}>
                                  {formatCurrency(tranche.amount || 0)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <Separator className="my-2 bg-border/50" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {splitRemainingAmount < 0 ? "Excess" : "Remaining"}
                          </span>
                          <span className={cn("text-sm font-bold tabular-nums",
                            splitRemainingAmount < 0 ? 'text-destructive' : 'text-foreground'
                          )}>
                            {formatCurrency(Math.abs(splitRemainingAmount))}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 border-t border-border/50 p-4">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 leading-none">
              <IconShieldLock className="size-3" />
              <span>Payments are processed securely.</span>
            </div>
          </CardFooter>
        </Card>
        </div>
      </motion.div>

      {/* Right Column: Interaction Form */}
      <motion.div variants={itemVariants} className="flex-1 w-full h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-8 pb-8">
          <Tabs value={paymentChoice} onValueChange={(v: string) => onTabChange(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Payment</TabsTrigger>
            <TabsTrigger value="split">Split Payment</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/5 py-5 px-6">
            <CardTitle className="text-lg font-semibold tracking-tight">Payment Setup</CardTitle>
            <CardDescription className="text-xs">
              {paymentChoice === "single" ? "Enter the top-up amount and select a payment method." : "Distribute your deposit across multiple methods."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            
            {/* Amount Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
                  Amount (PHP)
                </Label>
                {amount && <span className="text-xs font-medium text-primary">Target: {formatCurrency(amount)}</span>}
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground transition-colors group-focus-within:text-primary">₱</span>
                <Input
                  id="amount"
                  type="number"
                  className="h-14 pl-10 text-xl font-bold border-border/50 bg-background focus-visible:ring-primary focus-visible:ring-1 transition-all"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 5000, 10000].map((val) => (
                  <Button
                    key={val}
                    variant="secondary"
                    size="sm"
                    className="h-8 text-[11px] font-semibold bg-muted/50 hover:bg-muted border border-border/50"
                    onClick={() => setAmount(prev => (Number(prev || 0) + val).toString())}
                  >
                    +{val.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />


            <AnimatePresence mode="wait">
              {paymentChoice === "single" ? (
                <motion.div
                  key="single-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <Label className="text-xs font-medium text-muted-foreground">Select Payment Method</Label>

                    {hasProviderMethods ? (
                      <div className="space-y-6">
                        {(enabledProviders ?? []).map((provider) => {
                          if (!provider.methods || provider.methods.length === 0) return null;
                          return (
                            <div key={provider.code} className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-muted-foreground/60 whitespace-nowrap">
                                  via {provider.name}
                                </span>
                                <div className="h-px w-full bg-border/50" />
                              </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {provider.methods.map((method) => {
                                    const isSelected = selectedProviderMethodCode === method.code;
                                    return (
                                      <button
                                        key={method.code}
                                        type="button"
                                        onClick={() => {
                                          setSelectedProviderMethodCode(method.code);
                                          setSelectedMethodCode(
                                            (availableMethods.find((m) => m.code === method.code)?.code ?? method.code) as DepositMethodConfig["code"]
                                          );
                                        }}
                                        className={cn(
                                          "group relative flex flex-col items-center gap-3 p-4 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                          isSelected
                                            ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                                            : "border-border/50 bg-background hover:border-border hover:bg-muted/10"
                                        )}
                                      >
                                        <div className={cn(
                                          "flex items-center justify-center size-10 rounded-full border border-border/50 bg-background transition-transform group-hover:scale-105",
                                          isSelected && "border-primary/30"
                                        )}>
                                          <img
                                            src={methodIcon(method.code)}
                                            alt=""
                                            className="size-6 object-contain"
                                          />
                                        </div>
                                        <span className={cn("text-[11px] font-semibold transition-colors", 
                                          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                          {method.name}
                                        </span>
                                        {isSelected && (
                                          <div className="absolute top-2 right-2">
                                            <IconCheck className="size-3 text-primary" strokeWidth={3} />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableMethods.map((method) => {
                          const isSelected = selectedMethodCode === method.code;
                          return (
                            <button
                              key={method.code}
                              type="button"
                              onClick={() => setSelectedMethodCode(method.code)}
                              className={cn(
                                "group flex flex-col items-center gap-3 p-4 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isSelected 
                                  ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20" 
                                  : "border-border/50 bg-background hover:border-border hover:bg-muted/10"
                              )}
                            >
                              <div className={cn(
                                "size-10 flex items-center justify-center rounded-full border border-border/50 bg-background transition-transform group-hover:scale-105",
                                isSelected && "border-primary/30"
                              )}>
                                <img src={methodIcon(method.code)} alt="" className="size-6 object-contain" />
                              </div>
                              <span className={cn("text-[11px] font-semibold transition-colors",
                                isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                              )}>
                                {method.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="split-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold tracking-tight">Payment Allocation</Label>
                      <p className="text-[11px] text-muted-foreground font-medium">Distribute the total amount across methods</p>
                    </div>
                    <Badge 
                      variant={splitRemainingIsBalanced ? "default" : "outline"} 
                      className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        splitRemainingIsBalanced ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {splitRemainingIsBalanced ? "Balanced" : "Unbalanced"}
                    </Badge>
                  </div>

                  <div className="space-y-4">


                    <AnimatePresence mode="popLayout">
                      {splitTranches.map((tranche, index) => {
                        const isComplete = tranche.amount && tranche.methodCode;
                        return (
                          <motion.div
                            key={tranche.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            layout
                            className={cn(
                              "p-5 border rounded-lg space-y-5 bg-muted/5 relative transition-all duration-200",
                              isComplete ? "border-primary/20 shadow-sm" : "border-border/50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                                  isComplete ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                                )}>
                                  {index + 1}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Payment Leg</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeSplitTranche(tranche.id)}
                                disabled={splitTranches.length <= 1}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Amount</Label>
                                  {splitRemainingAmount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => updateSplitTranche(tranche.id, { amount: (Number(tranche.amount || 0) + splitRemainingAmount).toString() })}
                                      className="text-[10px] font-semibold text-primary hover:underline"
                                    >
                                      Use Remaining
                                    </button>
                                  )}
                                </div>
                                <div className="relative group">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold group-focus-within:text-primary transition-colors">₱</span>
                                  <Input
                                    type="number"
                                    className="h-11 pl-8 bg-background border-border/50 text-base font-bold focus-visible:ring-primary transition-all"
                                    placeholder="0.00"
                                    value={tranche.amount}
                                    onChange={(event) => updateSplitTranche(tranche.id, { amount: event.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Payment Method</Label>
                                <Select
                                  value={tranche.methodCode}
                                  onValueChange={(val) => updateSplitTranche(tranche.id, { methodCode: val as DepositMethodConfig["code"] })}
                                >
                                  <SelectTrigger className="h-11 bg-background border-border/50 text-sm font-medium focus:ring-primary transition-all">
                                    <SelectValue placeholder="Select Method" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {splitAvailableMethods.map(m => (
                                      <SelectItem key={m.code} value={m.code}>
                                        <div className="flex items-center gap-2.5">
                                          <img src={methodIcon(m.code)} alt="" className="size-4 object-contain" />
                                          <span className="text-xs font-medium">{m.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Separator className="bg-border/30" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Reference Number</Label>
                                <Input
                                  placeholder="TRX-123456"
                                  className="h-10 bg-background border-border/50 text-xs font-medium placeholder:text-muted-foreground/40"
                                  value={tranche.userReferenceNumber || ""}
                                  onChange={(event) => updateSplitTranche(tranche.id, { userReferenceNumber: event.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Proof of Payment</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="h-10 bg-background border-border/50 text-[11px] font-medium file:text-[11px] file:font-bold file:bg-muted file:border-none file:h-full file:mr-3 file:px-3 file:text-muted-foreground cursor-pointer"
                                  onChange={(event) => updateSplitTranche(tranche.id, { proofFile: event.target.files?.[0] || null })}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full border border-dashed border-border py-10 flex-col gap-2 h-auto hover:bg-muted/50 hover:border-primary/50 transition-all group"
                      onClick={addSplitTranche}
                      disabled={splitTranches.length >= 5}
                    >
                      <div className="size-8 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                        <IconPlus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">Add Payment Leg</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Split the balance across another method</p>
                      </div>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


          </CardContent>
          <CardFooter className="p-6 border-t border-border/50 bg-muted/5 flex flex-col gap-4">
            <Button
              onClick={handleConfirmPayment}
              disabled={isPending}
              size="lg"
              className="w-full h-12 text-sm font-semibold shadow-lg shadow-primary/10 active:scale-[0.98] transition-transform"
            >
              {isPending && <IconRefresh className="animate-spin mr-2 size-4" />}
              {paymentChoice === "single" ? "Confirm Deposit" : "Confirm Split Deposit"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium">
              <IconShieldLock className="size-3" />
              <span>Secured & Encrypted Transaction</span>
            </div>
          </CardFooter>

        </Card>
      </div>
      </motion.div>
    </motion.div>
  );
}

export default function DepositPage() {
  return (
    <div className="min-h-screen w-full bg-background relative selection:bg-primary selection:text-primary-foreground">
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] w-full"><IconRefresh className="animate-spin text-primary size-8" /></div>}>
        <DepositPageContent />
      </Suspense>
    </div>
  );
}

