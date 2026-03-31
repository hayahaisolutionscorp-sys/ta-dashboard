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
  IconCircleCheck,
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
import type {
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
          onClick={() => copyToClipboard(request.user_reference_number)}
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
// would like to add actual online transaction here
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
  const [paymentType, setPaymentType] = useState<"instant" | "manual" | null>(null);
  const [method, setMethod] = useState<string | null>(null);
  const [manualMethod, setManualMethod] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  const { data: enabledProviders, isLoading: providersLoading, refetch: refetchProviders } = useEnabledProviders();
  const createPaymongoCheckout = useCreatePaymongoCheckout();
  const initiatePaymongoPayment = useInitiatePaymongoPayment();
  const createMayaCheckout = useCreateMayaCheckout();
  const requestManualDeposit = useRequestManualDeposit();
  const uploadProof = useUploadDepositProof();

  useEffect(() => {
    if (open) {
      refetchProviders();
      setStep("amount");
      setAmount("");
      setPaymentType(null);
      setMethod(null);
      setManualMethod(null);
      setRefNumber("");
      setProofFile(null);
    }
  }, [open, refetchProviders]);

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
      targetProvider = (method === "card") ? "maya" : "paymongo";
    } else {
      return;
    }

    if (targetProvider === "maya") {
      createMayaCheckout.mutate(
        {
          totalAmount: { value: numAmount, currency: "PHP" },
          items: [{ name: "Wallet Deposit", quantity: 1, amount: { value: numAmount }, totalAmount: { value: numAmount }, description: `Deposit for travel agent ${agentId}` }],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          failureUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => { if (data?.checkoutUrl) window.location.href = data.checkoutUrl; },
          onError: (err) => { console.error("Maya error:", err); alert("Failed to create Maya checkout session."); },
        }
      );
    } else if (targetProvider === "paymongo") {
      if (paymongoEnabled && !mayaEnabled) {
        createPaymongoCheckout.mutate(
          {
            lineItems: [{ name: "Wallet Deposit", quantity: 1, amount: Math.round(numAmount * 100), currency: "PHP", description: `Deposit for travel agent ${agentId}` }],
            paymentMethodTypes: ["gcash", "paymaya", "card", "dob", "qrph", "grab_pay"],
            successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          },
          {
            onSuccess: (data) => { if (data?.checkoutUrl) window.location.href = data.checkoutUrl; },
            onError: (err) => { console.error("PayMongo error:", err); alert("Failed to create PayMongo checkout session."); },
          }
        );
      } else {
        initiatePaymongoPayment.mutate(
          { amount: numAmount, paymentMethodType: targetMethod, returnUrl: `${window.location.origin}/dashboard/wallet?success=true`, billing: { name: "Travel Agent", email: "agent@ayahay.com" } },
          {
            onSuccess: (data) => { if (data?.redirectUrl) window.location.href = data.redirectUrl; },
            onError: (err) => { console.error("PayMongo error:", err); alert("Failed to initiate PayMongo payment."); },
          }
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
      
      // 2. Create deposit request
      await requestManualDeposit.mutateAsync({
        travel_agent_id: agentId,
        travel_agency_id: agencyId,
        amount: Number(amount),
        payment_method: manualMethod,
        user_reference_number: refNumber,
        proof_url: proofUrl,
      });

      setStep("success");
    } catch (err) {
      console.error("Manual deposit error:", err);
      alert("Failed to submit manual deposit request.");
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
    <Dialog open={open} onOpenChange={setOpen}>
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
                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">₱</span>
                <Input
                  id="deposit-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  className="pl-7 text-lg font-bold"
                  placeholder="0.00"
                  value={amount}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && Number(amount) > 0) {
                          setStep("type");
                      }
                  }}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 5000, 10000].map(val => (
                    <Button 
                        key={val} 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8"
                        onClick={() => setAmount(val.toString())}
                    >
                        ₱{val.toLocaleString()}
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
                        {manualMethods.find(m => m.id === manualMethod)?.instructions}
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
        travel_agent_id: agentId,
        travel_agency_id: agencyId ?? undefined,
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
  const [activityPage, setActivityPage] = useState(1);
  const [depositPage, setDepositPage] = useState(1);

  const TABLE_PAGE_SIZE = 10;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("success") === "true") {
      setSuccessMsg(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (searchParams.get("canceled") === "true") {
      setCanceledMsg(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const { data, isLoading, refetch, isRefetching } = useAgentWallet(currentUser?.id, {
    activityPage,
    activityPageSize: TABLE_PAGE_SIZE,
    depositPage,
    depositPageSize: TABLE_PAGE_SIZE,
    depositStatus: "active",
  });

  const balance = data?.balance;
  const activities = data?.activities.results ?? [];
  const manualDeposits = data?.manualDeposits.results ?? [];
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
