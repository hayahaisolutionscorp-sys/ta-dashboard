/**
 * WalletService — manages travel agent wallet balances and transactions.
 *
 * Each agent has a wallet that can be topped up (deposited) by agency admins
 * and drawn down when bookings are made. Agents can also request withdrawals
 * which are processed by agency admins.
 *
 * Wallet flow:
 *  1. getAgentWallet()       fetch current balance + recent activity for display
 *  2. deposit()              agency admin credits the agent's wallet
 *  3. requestWithdrawal()    agent submits a withdrawal request for admin approval
 */
import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type {
  AgentWalletResponse,
  AgentWalletQueryParams,
  DepositPayload,
  WithdrawalRequest,
  WithdrawalRequestPayload,
  WalletActivity,
  PaymentProvider,
} from "@/constants/types/wallet.types";

class WalletService {
  /** Fetch the agent's wallet balance and recent activity history. */
  async getAgentWallet(
    agentId: string,
    params?: AgentWalletQueryParams,
  ): Promise<AgentWalletResponse> {
    const response = await api.get<AgentWalletResponse>(
      TRAVEL_AGENCY_API.WALLET.BY_AGENT(agentId),
      {
        params: {
          activity_page: params?.activityPage,
          activity_page_size: params?.activityPageSize,
          deposit_page: params?.depositPage,
          deposit_page_size: params?.depositPageSize,
          deposit_status: params?.depositStatus,
        },
      },
    );
    return response.data;
  }

  /**
   * Credit funds to an agent's wallet. Called by agency admins.
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
   * Submit a withdrawal request on behalf of an agent.
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
   * Initiate a PayMongo payment via Payment Intent (GCash, PayMaya, etc.)
   */
  async initiatePaymongoPayment(payload: any): Promise<{ redirectUrl: string; paymentIntentId: string }> {
    const response = await api.post(
      TRAVEL_AGENCY_API.PAYMENTS.PAYMONGO_INITIATE,
      payload,
    );
    return response.data.data;
  }

  /**
   * Create a PayMongo checkout session for wallet deposits.
   */
  async createPaymongoCheckoutSession(payload: any): Promise<{ checkoutUrl: string; checkoutSessionId: string; expiresAt: number }> {
    const response = await api.post(
      TRAVEL_AGENCY_API.PAYMENTS.CHECKOUT_SESSION,
      payload,
    );
    return response.data.data;
  }

  /**
   * Create a Maya checkout session for wallet deposits.
   */
  async createMayaCheckout(payload: any): Promise<{ checkoutUrl: string; checkoutId: string; transactionId: string }> {
    const response = await api.post(
      TRAVEL_AGENCY_API.PAYMENTS.MAYA_CHECKOUT,
      payload,
    );
    return response.data.data;
  }

  /**
   * Submit a manual deposit request with a reference number and proof of payment.
   */
  async requestManualDeposit(payload: any): Promise<any> {
    const response = await api.post(
      TRAVEL_AGENCY_API.WALLET.MANUAL_DEPOSIT,
      payload,
    );
    return response.data;
  }

  /**
   * Upload a proof of payment image to the private bucket.
   */
  async uploadProofOfPayment(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>(
      TRAVEL_AGENCY_API.MEDIA.UPLOAD_VERIFICATION,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  /**
   * Fetch only enabled payment providers.
   */
  async getEnabledProviders(): Promise<PaymentProvider[]> {
    const response = await api.get<PaymentProvider[]>(
      TRAVEL_AGENCY_API.PAYMENT_PROVIDERS.ENABLED,
    );
    return response.data;
  }
}

export const walletService = new WalletService();
