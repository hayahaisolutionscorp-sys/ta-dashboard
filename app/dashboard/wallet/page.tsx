"use client";

import { useState } from "react";
import {
  IconWallet,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconReceipt,
  IconRefresh,
  IconCheck,
  IconCopy,
  IconAlertCircle,
  IconCircleCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  useAgencyWallet,
  useEnabledProviders,
} from "@/hooks/queries/wallet/use-wallet";
import {
  useRequestWithdrawal,
  useCreatePaymongoCheckout,
  useInitiatePaymongoPayment,
  useCreateMayaCheckout,
  useRequestManualDeposit,
  useUploadDepositProof,
} from "@/hooks/mutations/wallet/use-wallet-mutations";
import type { WalletActivity } from "@/constants/types/wallet.types";

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `\u20B1${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  if (code.startsWith("MDEP-")) return "Manual Deposit";
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
      <TableCell className="px-3 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(activity.created_at)}
      </TableCell>
    </TableRow>
  );
}

function DepositDialog({
  agentId,
  agencyId,
}: {
  agentId: string;
  agencyId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"amount" | "type" | "manual_method" | "instant_method" | "manual_details" | "success">("amount");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [manualMethod, setManualMethod] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data: enabledProviders, refetch: refetchProviders } = useEnabledProviders();
  const createPaymongoCheckout = useCreatePaymongoCheckout();
  const initiatePaymongoPayment = useInitiatePaymongoPayment();
  const createMayaCheckout = useCreateMayaCheckout();
  const requestManualDeposit = useRequestManualDeposit();
  const uploadProof = useUploadDepositProof();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      refetchProviders();
      setStep("amount");
      setAmount("");
      setMethod(null);
      setManualMethod(null);
      setRefNumber("");
      setProofFile(null);
    }
  };

  const paymongoEnabled = enabledProviders?.some((p) => p.code === "paymongo");
  const mayaEnabled = enabledProviders?.some((p) => p.code === "maya");

  const isPending =
    createPaymongoCheckout.isPending ||
    initiatePaymongoPayment.isPending ||
    createMayaCheckout.isPending ||
    requestManualDeposit.isPending ||
    uploadProof.isPending;

  const handleInstantDeposit = () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) return;

    let targetProvider = "";
    let targetMethod = method;

    if (paymongoEnabled && !mayaEnabled) {
      targetProvider = "paymongo";
      targetMethod = "checkout";
    } else if (mayaEnabled && !paymongoEnabled) {
      targetProvider = "maya";
    } else if (paymongoEnabled && mayaEnabled) {
      if (!method) return;
      targetProvider = method === "card" ? "maya" : "paymongo";
    } else {
      return;
    }

    if (targetProvider === "maya") {
      createMayaCheckout.mutate(
        {
          totalAmount: { value: numAmount, currency: "PHP" },
          items: [{ name: "Wallet Deposit", quantity: 1, amount: { value: numAmount }, totalAmount: { value: numAmount }, description: `Agency wallet deposit` }],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          failureUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => { if (data?.checkoutUrl) window.location.href = data.checkoutUrl; },
          onError: () => { toast.error("Failed to create Maya checkout session."); },
        },
      );
    } else if (targetProvider === "paymongo") {
      if (paymongoEnabled && !mayaEnabled) {
        createPaymongoCheckout.mutate(
          {
            lineItems: [{ name: "Wallet Deposit", quantity: 1, amount: Math.round(numAmount * 100), currency: "PHP", description: `Agency wallet deposit` }],
            paymentMethodTypes: ["gcash", "paymaya", "card", "dob", "qrph", "grab_pay"],
            successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          },
          {
            onSuccess: (data) => { if (data?.checkoutUrl) window.location.href = data.checkoutUrl; },
            onError: () => { toast.error("Failed to create PayMongo checkout session."); },
          },
        );
      } else {
        initiatePaymongoPayment.mutate(
          { amount: numAmount, paymentMethodType: targetMethod, returnUrl: `${window.location.origin}/dashboard/wallet?success=true`, billing: { name: "Travel Agent", email: "agent@ayahay.com" } },
          {
            onSuccess: (data) => { if (data?.redirectUrl) window.location.href = data.redirectUrl; },
            onError: () => { toast.error("Failed to initiate PayMongo payment."); },
          },
        );
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!manualMethod || !refNumber) return;

    try {
      let proofUrl = "";
      if (proofFile) {
        const uploadRes = await uploadProof.mutateAsync(proofFile);
        proofUrl = uploadRes.url;
      }

      await requestManualDeposit.mutateAsync({
        travel_agent_id: agentId,
        travel_agency_id: agencyId ?? undefined,
        amount: Number(amount),
        payment_method: manualMethod,
        user_reference_number: refNumber,
        proof_url: proofUrl || undefined,
      });

      setStep("success");
    } catch {
      toast.error("Failed to submit manual deposit request.");
    }
  };

  const instantMethods = [
    { id: "gcash", name: "GCash", logo: "/GCash_logo.svg.png", provider: "paymongo" },
    { id: "paymaya", name: "Maya", logo: "/Maya_logo.svg.png", provider: "paymongo" },
    { id: "grab_pay", name: "Grab", logo: "/grab-pay-logo-png_seeklogo-371015.png", provider: "paymongo" },
    { id: "qrph", name: "QRPh", logo: "/QR_Ph_Logo.svg.png", provider: "paymongo" },
    { id: "card", name: "Card", logo: "/atm-card.png", provider: mayaEnabled ? "maya" : "paymongo" },
  ];

  const manualMethods = [
    { id: "GCash", name: "GCash", logo: "/GCash_logo.svg.png", instructions: "Transfer to 09XXXXXXXX and save the receipt." },
    { id: "Bank Transfer", name: "Bank", logo: "/transference.png", instructions: "BDO: Ayahay Inc. 1234567890" },
    { id: "Cash", name: "OTC", logo: "/ayahay-icon.png", instructions: "Visit our office at Ayahay Main." },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconArrowDownLeft className="size-4" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "success" ? "Request Submitted" : "Make a Deposit"}
          </DialogTitle>
          <DialogDescription>
            {step === "amount" && "Enter the amount you wish to deposit."}
            {step === "type" && "Choose between instant or manual payment."}
            {step === "instant_method" && "Select your preferred instant payment method."}
            {step === "manual_method" && "Select your preferred manual payment method."}
            {step === "manual_details" && "Transfer funds externally and then provide the details below."}
            {step === "success" && "Your request is now for verification by our admins."}
          </DialogDescription>
        </DialogHeader>

        {step === "amount" && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deposit-amount">Enter Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">{"\u20B1"}</span>
                <Input
                  id="deposit-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  className="pl-7 text-lg font-bold"
                  placeholder="0.00"
                  value={amount}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && Number(amount) > 0) {
                      setStep("type");
                    }
                  }}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 5000, 10000].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setAmount(val.toString())}
                >
                  {"\u20B1"}{val.toLocaleString()}
                </Button>
              ))}
            </div>

            <Button
              onClick={() => setStep("type")}
              disabled={Number(amount) <= 0}
              className="w-full h-11"
            >
              Continue
            </Button>
          </div>
        )}

        {step === "type" && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => setStep("instant_method")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <IconRefresh className="size-8" />
              </div>
              <div className="text-center">
                <span className="font-bold block">Instant Payment</span>
                <span className="text-xs text-muted-foreground">Pay via PayMongo/Maya</span>
              </div>
            </button>
            <button
              onClick={() => setStep("manual_method")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-muted hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
                <IconReceipt className="size-8" />
              </div>
              <div className="text-center">
                <span className="font-bold block">Manual Payment</span>
                <span className="text-xs text-muted-foreground">GCash, Bank, Cash, etc.</span>
              </div>
            </button>
          </div>
        )}

        {step === "instant_method" && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {instantMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:bg-accent ${
                    method === pm.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-transparent bg-muted/30"
                  }`}
                >
                  <div className="size-14 rounded-xl bg-white border border-muted p-2.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img src={pm.logo} alt={pm.name} className="size-full object-contain" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{pm.name}</span>
                  {method === pm.id && (
                    <div className="absolute -top-1 -right-1 size-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <IconCheck className="size-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>Back</Button>
              <Button
                className="flex-2"
                onClick={handleInstantDeposit}
                disabled={!method || isPending}
              >
                {isPending ? "Connecting..." : "Proceed"}
              </Button>
            </div>
          </div>
        )}

        {step === "manual_method" && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {manualMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setManualMethod(pm.id)}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:bg-accent/50 ${
                    manualMethod === pm.id ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-transparent bg-muted/30"
                  }`}
                >
                  <div className="size-14 rounded-xl bg-white border border-muted p-2.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <img src={pm.logo} alt={pm.name} className="size-full object-contain" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{pm.name}</span>
                  </div>
                  {manualMethod === pm.id && (
                    <div className="absolute -top-1 -right-1 size-5 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                      <IconCheck className="size-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {manualMethod && (
              <div className="rounded-lg bg-orange-50/50 border border-orange-100 p-3 mt-2">
                <p className="text-[10px] uppercase font-bold text-orange-900 mb-1 opacity-60">Instructions</p>
                <p className="text-xs text-orange-800 font-medium">
                  {manualMethods.find((m) => m.id === manualMethod)?.instructions}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>Back</Button>
              <Button
                className="flex-2 bg-orange-600 hover:bg-orange-700"
                onClick={() => setStep("manual_details")}
                disabled={!manualMethod}
              >
                I have paid
              </Button>
            </div>
          </div>
        )}

        {step === "manual_details" && (
          <div className="grid gap-4 py-4">
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 flex gap-2 items-start mb-2">
              <IconReceipt className="size-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-900">Uploading proof for {manualMethod}</p>
                <p className="text-xs text-orange-800">Amount: {formatCurrency(amount)}</p>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ref-number">Reference Number</Label>
              <Input
                id="ref-number"
                placeholder="Enter transaction reference"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proof-file">Proof of Payment (Optional)</Label>
              <Input
                id="proof-file"
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("manual_method")}>Back</Button>
              <Button
                className="flex-2 bg-green-600 hover:bg-green-700"
                onClick={handleManualSubmit}
                disabled={!refNumber || isPending}
              >
                {isPending ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <IconReceipt className="size-8" />
            </div>
            <div>
              <p className="text-lg font-bold">Verification Pending</p>
              <p className="text-sm text-muted-foreground px-8">
                We've received your deposit request. Please wait while our team verifies your payment.
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
  currentBalance,
}: {
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
      { amount: numAmount },
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
              <Label htmlFor="withdraw-amount">Amount ({"\u20B1"})</Label>
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
                  Amount exceeds the current balance of{" "}
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
  const [successMsg, setSuccessMsg] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      window.history.replaceState(null, "", window.location.pathname);
      return true;
    }
    return false;
  });
  const [canceledMsg, setCanceledMsg] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "true") {
      window.history.replaceState(null, "", window.location.pathname);
      return true;
    }
    return false;
  });

  const { data, isLoading, refetch, isRefetching } = useAgencyWallet(
    currentUser?.travel_agency_id,
  );

  const balance = data?.balance;
  const activities = data?.activities ?? [];
  const currentBalance = Number(balance?.balance ?? 0);
  const isAdmin = currentUser?.role === "Admin";

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
                <IconCircleCheck className="size-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Payment successful! Your deposit is complete. The funds may take a moment to reflect in your wallet balance.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setSuccessMsg(false)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <span className="text-xl">&times;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {canceledMsg && (
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <IconAlertCircle className="size-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Payment canceled. Your deposit session was not completed.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setCanceledMsg(false)}
                  className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <span className="text-xl">&times;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
            <p className="text-muted-foreground">
              Manage your agency wallet balance and transactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.id && (
              <>
                <DepositDialog
                  agentId={currentUser.id}
                  agencyId={currentUser.travel_agency_id}
                />
                {isAdmin && (
                  <WithdrawDialog currentBalance={currentBalance} />
                )}
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
              <TabsList className="text-muted-foreground mb-3 h-10 w-full justify-start gap-1 rounded-none border-b p-0">
                <TabsTrigger
                  value="activity"
                  className="h-10 flex-none rounded-none border-0 px-4 text-sm data-[state=active]:text-foreground"
                >
                  Wallet Activity
                  <Badge variant="secondary" className="ml-2">
                    {activities.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="deposits"
                  className="h-10 flex-none rounded-none border-0 px-4 text-sm data-[state=active]:text-foreground"
                >
                  Deposit Requests
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
                        <TableHead className="px-3 text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TransactionRow key={activity.id} activity={activity} />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="deposits" className="animate-in fade-in-0 duration-200">
                <div className="py-8 text-center text-xs italic text-muted-foreground">
                  Manual deposit request tracking will be available once deposit requests are submitted.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
