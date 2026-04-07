import { useQuery } from "@tanstack/react-query";
import { markupService } from "@/services/markup.service";

export function useAgencyAgents(enabled: boolean) {
  return useQuery({
    queryKey: ["agency-agents"],
    queryFn: () => markupService.getAgencyAgents(),
    enabled,
  });
}
