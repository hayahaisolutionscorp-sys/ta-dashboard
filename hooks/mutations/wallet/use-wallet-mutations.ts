/**
 * Wallet mutation hooks.
 *
 *  useDeposit()
 *    Credits funds to the agency wallet. Called by Admin agents.
 *    On success, invalidates the ["wallet", "agency"] cache so the
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
  ManualDepositPayload,
  WithdrawalRequestPayload,
} from "@/constants/types/wallet.types";

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepositPayload) => walletService.deposit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", "agency"],
      });
    },
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalRequestPayload) =>
      walletService.requestWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", "agency"],
      });
    },
  });
}

export function useRequestManualDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualDepositPayload) =>
      walletService.requestManualDeposit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", "agency"],
      });
    },
  });
}

export function useCreatePaymongoCheckout() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      walletService.createPaymongoCheckoutSession(payload),
  });
}

export function useInitiatePaymongoPayment() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      walletService.initiatePaymongoPayment(payload),
  });
}

export function useCreateMayaCheckout() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      walletService.createMayaCheckout(payload),
  });
}

export function useUploadDepositProof() {
  return useMutation({
    mutationFn: (file: File) => walletService.uploadProofOfPayment(file),
  });
}
