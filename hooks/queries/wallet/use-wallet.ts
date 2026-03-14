import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";

export function useAgentWallet(agentId: string | null | undefined) {
  return useQuery({
    queryKey: ["wallet", agentId],
    queryFn: () => walletService.getAgentWallet(agentId!),
    enabled: !!agentId,
  });
}
