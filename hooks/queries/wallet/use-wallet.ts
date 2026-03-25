/**
 * useAgentWallet — fetches the current wallet balance and activity history
 * for a travel agent.
 *
 * Used on the /dashboard/wallet page to display the agent's balance and
 * transaction log. Only runs when a valid agentId is present (i.e. after
 * auth has resolved).
 */
import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";

export function useAgentWallet(agentId: string | null | undefined) {
  return useQuery({
    queryKey: ["wallet", agentId],
    queryFn: () => walletService.getAgentWallet(agentId!),
    enabled: !!agentId,
  });
}
