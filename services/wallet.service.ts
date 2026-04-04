/**
 * WalletService — manages agency wallet balances and transactions.
 *
 * Each agency has a shared wallet. Admin agents can deposit and request
 * withdrawals. Staff agents use the wallet when booking trips.
 *
 * Wallet flow:
 *  1. getAgencyWallet()     fetch current balance + recent activity for the agency
 *  2. deposit()             admin agent credits the agency wallet
 *  3. requestWithdrawal()   admin agent submits a withdrawal request for approval
 */
import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type {
  AgencyWalletResponse,
  DepositPayload,
  ManualDepositPayload,
  ManualDepositRequest,
  PaymentProvider,
  WithdrawalRequest,
  WithdrawalRequestPayload,
  WalletActivity,
} from "@/constants/types/wallet.types";

class WalletService {
  /** Fetch the agency's wallet balance and activity history. */
  async getAgencyWallet(): Promise<AgencyWalletResponse> {
    const response = await api.get<AgencyWalletResponse>(
      TRAVEL_AGENCY_API.WALLET.BY_AGENCY,
    );
    return response.data;
  }

  /**
   * Credit funds to the agency wallet. Called by Admin agents.
   * Returns the resulting WalletActivity record for the deposit.
   */
  async deposit(payload: DepositPayload): Promise<WalletActivity> {
    const response = await api.post<WalletActivity>(
      TRAVEL_AGENCY_API.WALLET.DEPOSIT,
      payload,
    );
    return response.data;
  }

  /**
   * Submit a withdrawal request for the agency wallet.
   * The request is queued for admin approval — balance is not immediately
   * debited until the request is approved.
   */
  async requestWithdrawal(
    payload: WithdrawalRequestPayload,
  ): Promise<WithdrawalRequest> {
    const response = await api.post<WithdrawalRequest>(
      TRAVEL_AGENCY_API.WALLET.WITHDRAWAL_REQUEST,
      payload,
    );
    return response.data;
  }
  /**
   * Submit a manual deposit request (e.g., GCash, bank transfer).
   * The request is queued for admin verification before crediting the wallet.
   */
  async requestManualDeposit(
    payload: ManualDepositPayload,
  ): Promise<ManualDepositRequest> {
    const response = await api.post<ManualDepositRequest>(
      TRAVEL_AGENCY_API.WALLET.MANUAL_DEPOSIT,
      payload,
    );
    return response.data;
  }

  async initiatePaymongoPayment(
    payload: Record<string, unknown>,
  ): Promise<{ redirectUrl: string; paymentIntentId: string }> {
    const response = await api.post(
      TRAVEL_AGENCY_API.PAYMENTS.PAYMONGO_INITIATE,
      payload,
    );
    return response.data.data;
  }

  async createPaymongoCheckoutSession(
    payload: Record<string, unknown>,
  ): Promise<{ checkoutUrl: string; checkoutSessionId: string; expiresAt: number }> {
    const response = await api.post(
      TRAVEL_AGENCY_API.PAYMENTS.CHECKOUT_SESSION,
      payload,
    );
    return response.data.data;
  }

  async createMayaCheckout(
    payload: Record<string, unknown>,
  ): Promise<{ checkoutUrl: string; checkoutId: string; transactionId: string }> {
    const response = await api.post(
      TRAVEL_AGENCY_API.PAYMENTS.MAYA_CHECKOUT,
      payload,
    );
    return response.data.data;
  }

  async uploadProofOfPayment(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>(
      TRAVEL_AGENCY_API.MEDIA.UPLOAD_VERIFICATION,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  }

  async getEnabledProviders(): Promise<PaymentProvider[]> {
    const response = await api.get<PaymentProvider[]>(
      TRAVEL_AGENCY_API.PAYMENT_PROVIDERS.ENABLED,
    );
    return response.data;
  }
}

export const walletService = new WalletService();
