// ==================== Wallet Balance ====================

export interface WalletBalance {
  travel_agent_id: string;
  travel_agent_name: string;
  travel_agent_email: string;
  agency_name: string;
  transaction_count: number;
  balance: number;
  total_deposits: number;
  total_usage: number;
  last_transaction: string | null;
}

// ==================== Wallet Activity ====================

export interface WalletActivity {
  id: number;
  travel_agent_id: string;
  travel_agency_id: number | null;
  booking_id: string | null;
  amount: number;
  reference_code: string;
  transaction_type: "deposit" | "usage";
  created_at: string;
}

export interface AgentWalletResponse {
  balance: WalletBalance | null;
  activities: WalletActivity[];
}

// ==================== Withdrawal Request ====================

export interface WithdrawalRequest {
  id: number;
  travel_agent_id: string;
  travel_agency_id: number | null;
  amount: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejection_reason: string | null;
  created_at: string;
  processed_at: string | null;
}

// ==================== DTOs ====================

export interface DepositPayload {
  travel_agent_id: string;
  travel_agency_id?: number;
  amount: number;
}

export interface WithdrawalRequestPayload {
  travel_agent_id: string;
  travel_agency_id?: number;
  amount: number;
}

// ==================== Payment Provider ====================
export interface PaymentProvider {
  id: number;
  code: string;
  name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}
