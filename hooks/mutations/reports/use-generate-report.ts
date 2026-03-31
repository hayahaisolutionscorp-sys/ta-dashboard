import { useMutation } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";
import type { GenerateReportParams } from "@/constants/types/report.types";

export function useGenerateAgencyReport() {
  return useMutation({
    mutationFn: (params: GenerateReportParams) =>
      reportService.downloadAgencyReport(params),
  });
}

export function useGenerateStaffReport() {
  return useMutation({
    mutationFn: (params: GenerateReportParams) =>
      reportService.downloadStaffReport(params),
  });
}
