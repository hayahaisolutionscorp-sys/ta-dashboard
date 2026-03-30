/**
 * useAgencyWallet — fetches the current wallet balance and activity history
 * for the agent's agency.
 *
 * Used on the /dashboard/wallet page to display the agency balance and
 * transaction log. Only runs when a valid agencyId is present (i.e. after
 * auth has resolved).
 */
import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";

export function useAgencyWallet(agencyId: number | null | undefined) {
  return useQuery({
    queryKey: ["wallet", "agency", agencyId],
    queryFn: () => walletService.getAgencyWallet(),
    enabled: !!agencyId,
  });
}
