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
  DepositPayload,
  WithdrawalRequest,
  WithdrawalRequestPayload,
  WalletActivity,
} from "@/constants/types/wallet.types";

class WalletService {
  /** Fetch the agent's wallet balance and recent activity history. */
  async getAgentWallet(agentId: string): Promise<AgentWalletResponse> {
    const response = await api.get<AgentWalletResponse>(
      TRAVEL_AGENCY_API.WALLET.BY_AGENT(agentId),
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
}

export const walletService = new WalletService();
