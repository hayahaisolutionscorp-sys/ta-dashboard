"use client";

import { useState } from "react";
import {
  IconWallet,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCash,
  IconReceipt,
  IconRefresh,
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
import { useAgentWallet } from "@/hooks/queries/wallet/use-wallet";
import {
  useDeposit,
  useRequestWithdrawal,
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

function DepositDialog({
  agentId,
  agencyId,
}: {
  agentId: string;
  agencyId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const depositMutation = useDeposit();

  const handleDeposit = () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) return;
    depositMutation.mutate(
      {
        travel_agent_id: agentId,
        travel_agency_id: agencyId ?? undefined,
        amount: numAmount,
      },
      {
        onSuccess: () => {
          setAmount("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconArrowDownLeft className="size-4" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a Deposit</DialogTitle>
          <DialogDescription>
            Add funds to your travel agency wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
            disabled={depositMutation.isPending || Number(amount) <= 0}
          >
            {depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
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
