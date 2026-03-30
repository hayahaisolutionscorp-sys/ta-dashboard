// ==================== Wallet Balance (per agency) ====================

export interface WalletBalance {
  travel_agency_id: number;
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
  travel_agent_id: string | null;
  travel_agency_id: number;
  booking_id: string | null;
  amount: number;
  reference_code: string;
  transaction_type: "deposit" | "usage";
  created_at: string;
  performed_by: string | null;
}

export interface AgencyWalletResponse {
  balance: WalletBalance | null;
  activities: WalletActivity[];
}

// ==================== Withdrawal Request ====================

export interface WithdrawalRequest {
  id: number;
  travel_agent_id: string;
  travel_agency_id: number;
  amount: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejection_reason: string | null;
  created_at: string;
  processed_at: string | null;
}

// ==================== DTOs ====================

export interface DepositPayload {
  amount: number;
}

export interface WithdrawalRequestPayload {
  amount: number;
}
