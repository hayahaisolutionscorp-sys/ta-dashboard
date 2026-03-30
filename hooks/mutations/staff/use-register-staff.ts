import { useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "@/services/staff.service";
import type { RegisterStaffPayload } from "@/lib/types/staff.types";

export function useRegisterStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterStaffPayload) =>
      staffService.registerStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-staff"] });
      queryClient.invalidateQueries({ queryKey: ["agency-agents"] });
    },
  });
}
