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
  async getAgentWallet(agentId: string): Promise<AgentWalletResponse> {
    const response = await api.get<AgentWalletResponse>(
      TRAVEL_AGENCY_API.WALLET.BY_AGENT(agentId),
    );
    return response.data;
  }

  async deposit(payload: DepositPayload): Promise<WalletActivity> {
    const response = await api.post<WalletActivity>(
      TRAVEL_AGENCY_API.WALLET.DEPOSIT,
      payload,
    );
    return response.data;
  }

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
