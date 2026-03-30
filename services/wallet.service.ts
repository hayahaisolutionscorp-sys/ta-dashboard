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
}

export const walletService = new WalletService();
