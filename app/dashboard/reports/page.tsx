"use client";

import { useState } from "react";
import {
  IconReportAnalytics,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconDownload,
  IconEye,
  IconArrowLeft,
  IconLoader2,
  IconUsers,
  IconTicket,
  IconCash,
  IconWallet,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  useAgencyReportData,
  useStaffReportData,
} from "@/hooks/queries/reports/use-report-data";
import {
  useGenerateAgencyReport,
  useGenerateStaffReport,
} from "@/hooks/mutations/reports/use-generate-report";
import { toast } from "sonner";
import type {
  AgencyPerformanceData,
  StaffPerformanceData,
} from "@/constants/types/report.types";

type ReportType = "agency-performance" | "staff-performance";
type ExportFormat = "pdf" | "excel";

function formatCurrency(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [reportType, setReportType] = useState<ReportType>("agency-performance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [previewRequested, setPreviewRequested] = useState(false);

  const canPreview = dateFrom && dateTo && dateFrom <= dateTo;

  const agencyData = useAgencyReportData(
    { date_from: dateFrom, date_to: dateTo },
    previewRequested && reportType === "agency-performance" && canPreview,
  );

  const staffData = useStaffReportData(
    { date_from: dateFrom, date_to: dateTo },
    previewRequested && reportType === "staff-performance" && canPreview,
  );

  const agencyDownload = useGenerateAgencyReport();
  const staffDownload = useGenerateStaffReport();

  const isPreviewLoading =
    (reportType === "agency-performance" && agencyData.isLoading) ||
    (reportType === "staff-performance" && staffData.isLoading);

  const hasPreviewData =
    (reportType === "agency-performance" && agencyData.data) ||
    (reportType === "staff-performance" && staffData.data);

  const isDownloading = agencyDownload.isPending || staffDownload.isPending;

  if (user?.role !== "Admin") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">
          Access denied. Admin role required.
        </p>
      </div>
    );
  }

  const handlePreview = () => {
    if (!canPreview) {
      toast.error("Please select a valid date range");
      return;
    }
    setPreviewRequested(true);
  };

  const handleDownload = () => {
    const params = { date_from: dateFrom, date_to: dateTo, format };
    const mutation =
      reportType === "agency-performance" ? agencyDownload : staffDownload;

    mutation.mutate(params, {
      onSuccess: () => toast.success("Report downloaded successfully"),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to generate report",
        ),
    });
  };

  const handleReset = () => {
    setPreviewRequested(false);
    agencyData.remove?.();
    staffData.remove?.();
  };

  const handleReportTypeChange = (value: string) => {
    setReportType(value as ReportType);
    setPreviewRequested(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <IconReportAnalytics className="size-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate performance reports for your agency
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      {!hasPreviewData && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={handleReportTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency-performance">
                    Agency Performance
                  </SelectItem>
                  <SelectItem value="staff-performance">
                    Staff Performance
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {reportType === "agency-performance"
                  ? "Overall agency bookings, revenue, markup earnings, and wallet summary"
                  : "Per-staff breakdown of bookings, revenue, and markup earned"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_from">From</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPreviewRequested(false);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_to">To</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPreviewRequested(false);
                  }}
                />
              </div>
            </div>

            <Button
              onClick={handlePreview}
              disabled={!canPreview || isPreviewLoading}
              className="w-full"
            >
              {isPreviewLoading ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Loading preview...
                </>
              ) : (
                <>
                  <IconEye className="mr-2 size-4" />
                  Preview Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Loading */}
      {previewRequested && isPreviewLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Agency Performance Preview */}
      {reportType === "agency-performance" && agencyData.data && (
        <AgencyPreview
          data={agencyData.data}
          format={format}
          onFormatChange={setFormat}
          onDownload={handleDownload}
          onBack={handleReset}
          isDownloading={isDownloading}
        />
      )}

      {/* Staff Performance Preview */}
      {reportType === "staff-performance" && staffData.data && (
        <StaffPreview
          data={staffData.data}
          format={format}
          onFormatChange={setFormat}
          onDownload={handleDownload}
          onBack={handleReset}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
}

// ── Agency Preview Component ──────────────────────────────

function AgencyPreview({
  data,
  format,
  onFormatChange,
  onDownload,
  onBack,
  isDownloading,
}: {
  data: AgencyPerformanceData;
  format: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  onDownload: () => void;
  onBack: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{data.agency_name}</h2>
          <p className="text-sm text-muted-foreground">
            {data.date_range.from} to {data.date_range.to}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <IconArrowLeft className="mr-1 size-4" />
            New Report
          </Button>
          <FormatToggle value={format} onChange={onFormatChange} />
          <Button onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconDownload className="mr-2 size-4" />
            )}
            Download
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={IconTicket}
          label="Total Bookings"
          value={data.summary.total_bookings.toString()}
        />
        <StatCard
          icon={IconUsers}
          label="Total Passengers"
          value={data.summary.total_passengers.toString()}
        />
        <StatCard
          icon={IconCash}
          label="Total Revenue"
          value={formatCurrency(data.summary.total_revenue)}
        />
        <StatCard
          icon={IconWallet}
          label="Markup Earned"
          value={formatCurrency(data.summary.total_markup_earned)}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.booking_breakdown_by_status).map(
              ([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span>
                    <Badge variant="outline" className="mr-2">
                      {status}
                    </Badge>
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ),
            )}
            {Object.keys(data.booking_breakdown_by_status).length === 0 && (
              <p className="text-sm text-muted-foreground">No bookings</p>
            )}
          </CardContent>
        </Card>

        {/* By Route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.booking_breakdown_by_route)
              .slice(0, 8)
              .map(([route, info]) => (
                <div key={route} className="flex justify-between text-sm">
                  <span className="truncate max-w-[140px]">{route}</span>
                  <span className="font-medium">{info.count}</span>
                </div>
              ))}
            {Object.keys(data.booking_breakdown_by_route).length === 0 && (
              <p className="text-sm text-muted-foreground">No bookings</p>
            )}
          </CardContent>
        </Card>

        {/* By Payment Method */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              By Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.booking_breakdown_by_payment_method).map(
              ([method, info]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span>{method}</span>
                  <span className="font-medium">{info.count}</span>
                </div>
              ),
            )}
            {Object.keys(data.booking_breakdown_by_payment_method).length ===
              0 && (
              <p className="text-sm text-muted-foreground">No bookings</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wallet Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Wallet Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Balance</p>
              <p className="font-semibold">
                {formatCurrency(data.wallet_summary.current_balance)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Deposits</p>
              <p className="font-semibold">
                {formatCurrency(data.wallet_summary.total_deposits)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Usage</p>
              <p className="font-semibold">
                {formatCurrency(data.wallet_summary.total_usage)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Transactions</p>
              <p className="font-semibold">
                {data.wallet_summary.transaction_count}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Staff Preview Component ───────────────────────────────

function StaffPreview({
  data,
  format,
  onFormatChange,
  onDownload,
  onBack,
  isDownloading,
}: {
  data: StaffPerformanceData;
  format: ExportFormat;
  onFormatChange: (f: ExportFormat) => void;
  onDownload: () => void;
  onBack: () => void;
  isDownloading: boolean;
}) {
  const totalBookings = data.staff_summary.reduce(
    (s, a) => s + a.total_bookings,
    0,
  );
  const totalRevenue = data.staff_summary.reduce(
    (s, a) => s + a.total_revenue,
    0,
  );
  const totalMarkup = data.staff_summary.reduce(
    (s, a) => s + a.total_markup_earned,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{data.agency_name}</h2>
          <p className="text-sm text-muted-foreground">
            Staff Performance — {data.date_range.from} to {data.date_range.to}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <IconArrowLeft className="mr-1 size-4" />
            New Report
          </Button>
          <FormatToggle value={format} onChange={onFormatChange} />
          <Button onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconDownload className="mr-2 size-4" />
            )}
            Download
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={IconUsers}
          label="Total Staff"
          value={data.staff_summary.length.toString()}
        />
        <StatCard
          icon={IconTicket}
          label="Total Bookings"
          value={totalBookings.toString()}
        />
        <StatCard
          icon={IconCash}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
        />
        <StatCard
          icon={IconWallet}
          label="Total Markup"
          value={formatCurrency(totalMarkup)}
        />
      </div>

      {/* Staff Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Staff Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 font-medium text-center">Bookings</th>
                  <th className="pb-2 font-medium text-center">Pax</th>
                  <th className="pb-2 font-medium text-center">Cargo</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">Markup</th>
                </tr>
              </thead>
              <tbody>
                {data.staff_summary.map((s) => (
                  <tr key={s.agent_id} className="border-b last:border-0">
                    <td className="py-2">
                      <div>
                        <p className="font-medium">{s.agent_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-2 text-center">{s.total_bookings}</td>
                    <td className="py-2 text-center">{s.total_passengers}</td>
                    <td className="py-2 text-center">{s.total_cargo_items}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(s.total_revenue)}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(s.total_markup_earned)}
                    </td>
                  </tr>
                ))}
                {data.staff_summary.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No staff data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Shared Components ─────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormatToggle({
  value,
  onChange,
}: {
  value: ExportFormat;
  onChange: (f: ExportFormat) => void;
}) {
  return (
    <div className="flex items-center rounded-md border">
      <button
        type="button"
        onClick={() => onChange("excel")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-l-md transition-colors ${
          value === "excel"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
      >
        <IconFileSpreadsheet className="size-4" />
        Excel
      </button>
      <button
        type="button"
        onClick={() => onChange("pdf")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-r-md transition-colors ${
          value === "pdf"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
      >
        <IconFileTypePdf className="size-4" />
        PDF
      </button>
    </div>
  );
}
