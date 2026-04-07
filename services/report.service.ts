import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type {
  AgencyPerformanceData,
  StaffPerformanceData,
  GenerateReportParams,
  ReportDataParams,
} from "@/constants/types/report.types";

class ReportService {
  // ── JSON data endpoints (for preview) ───────────────────

  async getAgencyReportData(
    params: ReportDataParams,
  ): Promise<AgencyPerformanceData> {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(
      `${TRAVEL_AGENCY_API.REPORTS.AGENCY_PERFORMANCE_DATA}?${query}`,
    );
    return data;
  }

  async getStaffReportData(
    params: ReportDataParams,
  ): Promise<StaffPerformanceData> {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(
      `${TRAVEL_AGENCY_API.REPORTS.STAFF_PERFORMANCE_DATA}?${query}`,
    );
    return data;
  }

  // ── File download endpoints ─────────────────────────────

  async downloadAgencyReport(params: GenerateReportParams): Promise<void> {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(
      `${TRAVEL_AGENCY_API.REPORTS.AGENCY_PERFORMANCE}?${query}`,
      { responseType: "blob" },
    );
    this.downloadBlob(response.data, response.headers);
  }

  async downloadStaffReport(params: GenerateReportParams): Promise<void> {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(
      `${TRAVEL_AGENCY_API.REPORTS.STAFF_PERFORMANCE}?${query}`,
      { responseType: "blob" },
    );
    this.downloadBlob(response.data, response.headers);
  }

  // ── Helpers ─────────────────────────────────────────────

  private downloadBlob(blob: Blob, headers: Record<string, string>) {
    const disposition = headers["content-disposition"] || "";
    const filenameMatch = disposition.match(/filename="(.+?)"/);
    const filename = filenameMatch?.[1] ?? "report";

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const reportService = new ReportService();
