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

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AgentWalletQueryParams {
  activityPage?: number;
  activityPageSize?: number;
  depositPage?: number;
  depositPageSize?: number;
  depositStatus?: "active" | "for_verification" | "rejected" | "success" | "all";
}

export interface AgentWalletResponse {
  balance: WalletBalance | null;
  activities: PaginatedResponse<WalletActivity>;
  manualDeposits: PaginatedResponse<ManualDepositRequest>;
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

// ==================== Manual Deposit ====================

export interface ManualDepositPayload {
  travel_agent_id: string;
  travel_agency_id?: number;
  amount: number;
  payment_method: string;
  user_reference_number: string;
  proof_url?: string;
}

export interface ManualDepositRequest {
  id: number;
  travel_agent_id: string;
  travel_agency_id: number | null;
  amount: number;
  payment_method: string;
  user_reference_number: string | null;
  proof_url: string | null;
  deposit_reference?: string;
  status: "for_verification" | "success" | "rejected";
  rejection_reason?: string | null;
  admin_id?: string | null;
  processed_by_name?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs ====================

export interface DepositPayload {
  amount: number;
}

export interface WithdrawalRequestPayload {
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
