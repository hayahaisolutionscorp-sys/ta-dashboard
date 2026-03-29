"use client";

import { useState, useEffect } from "react";
import {
  IconWallet,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCash,
  IconReceipt,
  IconRefresh,
  IconBrandGoogleHome,
  IconCreditCard,
  IconDeviceMobile,
  IconBuildingBank,
  IconQrcode,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/hooks/mutations/wallet/use-wallet-mutations";
import type { WalletActivity } from "@/constants/types/wallet.types";

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

function TransactionRow({ activity }: { activity: WalletActivity }) {
  const isDeposit = activity.transaction_type === "deposit";

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-9 items-center justify-center rounded-full ${isDeposit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
        >
          {isDeposit ? (
            <IconArrowDownLeft className="size-4" />
          ) : (
            <IconArrowUpRight className="size-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {referenceLabel(activity.reference_code)}
          </p>
          <p className="text-xs text-muted-foreground">
            {activity.reference_code}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold ${isDeposit ? "text-green-600" : "text-red-600"}`}
        >
          {isDeposit ? "+" : "-"}
          {formatCurrency(activity.amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(activity.created_at)}
        </p>
      </div>
    </div>
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
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  
  const { data: enabledProviders, isLoading: providersLoading, refetch: refetchProviders } = useEnabledProviders();
  const createPaymongoCheckout = useCreatePaymongoCheckout();
  const initiatePaymongoPayment = useInitiatePaymongoPayment();
  const createMayaCheckout = useCreateMayaCheckout();

  useEffect(() => {
    if (open) refetchProviders();
  }, [open, refetchProviders]);

  const paymongoEnabled = enabledProviders?.some((p) => p.code === "paymongo");
  const mayaEnabled = enabledProviders?.some((p) => p.code === "maya");

  const isPending = 
    createPaymongoCheckout.isPending || 
    initiatePaymongoPayment.isPending || 
    createMayaCheckout.isPending;

  const handleDeposit = () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) return;

    // Determine target provider and method
    let targetProvider = "";
    let targetMethod = method;

    if (paymongoEnabled && !mayaEnabled) {
      targetProvider = "paymongo";
      targetMethod = "checkout"; // Use hosted checkout session for single-provider PayMongo for simplicity or we can use a default method
    } else if (mayaEnabled && !paymongoEnabled) {
      targetProvider = "maya";
    } else if (paymongoEnabled && mayaEnabled) {
      if (!method) return;
      targetProvider = (method === "card") ? "maya" : "paymongo";
    } else {
      return; // No providers enabled
    }

    if (targetProvider === "maya") {
      createMayaCheckout.mutate(
        {
          totalAmount: { value: numAmount, currency: "PHP" },
          items: [
            {
              name: "Wallet Deposit",
              quantity: 1,
              amount: { value: numAmount },
              totalAmount: { value: numAmount },
              description: `Deposit for travel agent ${agentId}`,
            },
          ],
          successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          failureUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
        },
        {
          onSuccess: (data) => {
            if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
            else alert("Maya Checkout URL not returned.");
          },
          onError: (err) => {
            console.error("Maya error:", err);
            alert("Failed to create Maya checkout session.");
          },
        }
      );
    } else if (targetProvider === "paymongo") {
      if (paymongoEnabled && !mayaEnabled) {
        // Use generic checkout if only paymongo is enabled (as requested: "Deposit via Paymongo")
        createPaymongoCheckout.mutate(
          {
            lineItems: [
              {
                name: "Wallet Deposit",
                quantity: 1,
                amount: Math.round(numAmount * 100),
                currency: "PHP",
                description: `Deposit for travel agent ${agentId}`,
              },
            ],
            paymentMethodTypes: ["gcash", "paymaya", "card", "dob", "qrph", "grab_pay"],
            successUrl: `${window.location.origin}/dashboard/wallet?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/wallet?canceled=true`,
          },
          {
            onSuccess: (data) => {
              if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
              else alert("PayMongo Checkout URL not returned.");
            },
            onError: (err) => {
              console.error("PayMongo error:", err);
              alert("Failed to create PayMongo checkout session.");
            },
          }
        );
      } else {
        // Both enabled, use specific method initiation
        initiatePaymongoPayment.mutate(
          {
              amount: numAmount,
              paymentMethodType: targetMethod,
              returnUrl: `${window.location.origin}/dashboard/wallet?success=true`,
              billing: {
                  name: "Travel Agent", 
                  email: "agent@ayahay.com",
              }
          },
          {
            onSuccess: (data) => {
              if (data?.redirectUrl) window.location.href = data.redirectUrl;
              else alert("PayMongo redirect URL not returned.");
            },
            onError: (err) => {
              console.error("PayMongo error:", err);
              alert("Failed to initiate PayMongo payment.");
            },
          }
        );
      }
    }
  };

  const paymentMethods = [
    { id: "gcash", name: "GCash", icon: <IconDeviceMobile className="size-5" />, provider: "paymongo" },
    { id: "paymaya", name: "Maya Wallet", icon: <IconDeviceMobile className="size-5" />, provider: "paymongo" },
    { id: "grab_pay", name: "GrabPay", icon: <IconDeviceMobile className="size-5" />, provider: "paymongo" },
    { id: "dob", name: "Online Banking", icon: <IconBuildingBank className="size-5" />, provider: "paymongo" },
    { id: "qrph", name: "QRPh", icon: <IconQrcode className="size-5" />, provider: "paymongo" },
    { id: "card", name: "Cards", icon: <IconCreditCard className="size-5" />, provider: mayaEnabled ? "maya" : "paymongo" },
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
          <DialogTitle>Make a Deposit</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method and amount.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deposit-amount">Amount (₱)</Label>
            <Input
              id="deposit-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              />
          </div>

          {paymongoEnabled && mayaEnabled && (
            <div className="grid gap-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => {
                  const isSelected = method === pm.id;
                  const isDisabled = pm.provider === 'paymongo' ? !paymongoEnabled : !mayaEnabled;
                  
                  if (isDisabled) return null;

                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setMethod(pm.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-muted hover:border-muted-foreground/50"
                      }`}
                    >
                      <div className={`${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                        {pm.icon}
                      </div>
                      <span className="text-sm font-medium">{pm.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
            onClick={handleDeposit}
            disabled={isPending || Number(amount) <= 0 || (paymongoEnabled && mayaEnabled && !method) || providersLoading}
          >
            {isPending ? "Redirecting..." : (providersLoading ? "Checking..." : (
              paymongoEnabled && mayaEnabled 
                ? "Proceed to Payment" 
                : (paymongoEnabled ? "Deposit via PayMongo" : (mayaEnabled ? "Deposit via Maya" : "No Provider"))
            ))}
          </Button>
        </DialogFooter>
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

  const { data, isLoading, refetch, isRefetching } = useAgentWallet(
    currentUser?.id,
  );

  const balance = data?.balance;
  const activities = data?.activities ?? [];
  const currentBalance = Number(balance?.balance ?? 0);

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

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconReceipt className="size-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex h-50 items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <IconCash className="mx-auto size-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No transactions yet. Make a deposit to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <TransactionRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
