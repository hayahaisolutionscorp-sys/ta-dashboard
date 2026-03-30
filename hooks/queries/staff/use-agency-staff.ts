import { useQuery } from "@tanstack/react-query";
import { staffService } from "@/services/staff.service";

export function useAllAgencyStaff(enabled: boolean) {
  return useQuery({
    queryKey: ["agency-staff"],
    queryFn: () => staffService.getAllAgencyStaff(),
    enabled,
  });
}
