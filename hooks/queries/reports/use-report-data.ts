import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";
import type { ReportDataParams } from "@/constants/types/report.types";

export function useAgencyReportData(
  params: ReportDataParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["reports", "agency-performance", params],
    queryFn: () => reportService.getAgencyReportData(params),
    enabled,
  });
}

export function useStaffReportData(
  params: ReportDataParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["reports", "staff-performance", params],
    queryFn: () => reportService.getStaffReportData(params),
    enabled,
  });
}
