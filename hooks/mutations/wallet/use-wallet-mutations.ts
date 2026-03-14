import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
import type {
  DepositPayload,
  WithdrawalRequestPayload,
} from "@/constants/types/wallet.types";

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepositPayload) => walletService.deposit(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", variables.travel_agent_id],
      });
    },
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalRequestPayload) =>
      walletService.requestWithdrawal(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", variables.travel_agent_id],
      });
    },
  });
}
