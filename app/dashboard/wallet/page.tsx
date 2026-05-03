"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <p className="text-xs font-mono text-muted-foreground uppercase">
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
          <p className="text-xs font-mono text-muted-foreground uppercase">
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
              className="border-orange-200 bg-orange-50 px-1.5 text-xs font-medium text-orange-700"
            >
              Pending
            </Badge>
          )}
          {request.status === "rejected" && (
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="border-red-200 bg-red-50 px-1.5 text-xs font-medium text-red-700"
              >
                Rejected
              </Badge>
              {request.rejection_reason && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700">
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
              className="border-green-200 bg-green-50 px-1.5 text-xs font-medium text-green-700"
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

function DepositDialog({
  agentId,
  agencyId,
}: {
  agentId: string;
  agencyId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Select your preferred payment arrangement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex items-center group">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-1 p-4 text-left hover:border-primary/50 transition-colors"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/wallet/deposit?type=single");
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <IconWallet className="size-4" />
                  <span>Single Payment</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  Deposit the full amount using one payment method.
                </span>
              </Button>
              <div className="absolute right-4 top-4">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="cursor-help text-muted-foreground hover:text-primary transition-colors">
                      <IconInfoCircle className="size-4" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Single Payment</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The standard way to top up your wallet. Choose one payment provider (like GCash, Maya, or Bank Transfer) and settle the total amount in a single transaction.
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1 h-4">Recommended</Badge>
                        <span className="text-[10px] text-muted-foreground">Fastest processing</span>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>

            <div className="relative flex items-center group">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-1 p-4 text-left hover:border-primary/50 transition-colors"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/wallet/deposit?type=split");
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <IconRefresh className="size-4" />
                  <span>Split Payment</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  Divide the total amount into multiple smaller payments.
                </span>
              </Button>
              <div className="absolute right-4 top-4">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="cursor-help text-muted-foreground hover:text-primary transition-colors">
                      <IconInfoCircle className="size-4" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Split Payment</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Ideal for large deposits that exceed your bank's or e-wallet's daily transaction limits. You can configure up to 5 separate "tranches" using different methods or accounts to reach your target balance.
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1 h-4">Flexible</Badge>
                        <span className="text-[10px] text-muted-foreground">Bypass daily limits</span>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </div>
        </div>
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
