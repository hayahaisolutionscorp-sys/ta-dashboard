/**
 * Wallet mutation hooks.
 *
 *  useDeposit()
 *    Credits funds to an agent's wallet. Called by agency admins.
 *    On success, invalidates the ["wallet", agentId] cache so the
 *    wallet page balance and activity list refresh immediately.
 *
 *  useRequestWithdrawal()
 *    Submits a withdrawal request for admin approval.
 *    Balance is not debited until the request is approved on the admin side.
 *    On success, invalidates the wallet cache to reflect the pending state.
 */
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

export function useCreatePaymongoCheckout() {
  return useMutation({
    mutationFn: (payload: any) =>
      walletService.createPaymongoCheckoutSession(payload),
  });
}

export function useInitiatePaymongoPayment() {
  return useMutation({
    mutationFn: (payload: any) => walletService.initiatePaymongoPayment(payload),
  });
}

export function useCreateMayaCheckout() {
  return useMutation({
    mutationFn: (payload: any) => walletService.createMayaCheckout(payload),
  });
}

export function useRequestManualDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => walletService.requestManualDeposit(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", variables.travel_agent_id],
      });
    },
  });
}

export function useUploadDepositProof() {
  return useMutation({
    mutationFn: (file: File) => walletService.uploadProofOfPayment(file),
  });
}
