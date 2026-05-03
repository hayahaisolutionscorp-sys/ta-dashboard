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
  commission_amount: number | null;
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
export interface EnabledPaymentMethod {
  id: string;
  code: string;
  name: string;
  is_enabled: boolean;
  payment_provider_id: number;
}

export interface PaymentProvider {
  id: number;
  code: string;
  name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  methods: EnabledPaymentMethod[];
}

export interface DepositMethodConfig {
  code: "gcash" | "paymaya" | "grabpay" | "qrph" | "cards" | "bank_transfer" | "cash" | "gcash_manual";
  name: string;
  kind: "instant" | "manual";
  min_amount: number;
  max_amount: number;
  split_limit: number;
  requires_reference: boolean;
  requires_proof: boolean;
  is_enabled: boolean;
  provider_code: "paymongo" | "maya" | null;
  gateway_method: string | null;
}

// ==================== Split Deposit ====================

export interface SplitDepositLegPayload {
  amount: number;
  legType: "instant" | "manual";
  paymentMethod: string;
  paymentProvider?: string;
  userReferenceNumber?: string;
  proofUrl?: string;
}

export interface CreateSplitDepositPayload {
  totalAmount: number;
  legs: SplitDepositLegPayload[];
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateSplitDepositResponse {
  splitTransactionId: string;
  referenceCode: string;
  totalAmount: number;
  paidAmount: number;
  status: "pending" | "partial_paid" | "fully_paid" | "failed" | "cancelled";
  checkoutUrl?: string;
  checkoutSessionId?: string;
  requiresManualReview: boolean;
}

export interface SplitDepositLeg {
  id: string;
  split_transaction_id: string;
  leg_order: number;
  amount: number;
  leg_type: "instant" | "manual";
  provider_code: string | null;
  payment_method: string | null;
  status:
    | "pending"
    | "processing"
    | "for_verification"
    | "paid"
    | "rejected"
    | "failed"
    | "expired";
  checkout_session_id: string | null;
  payment_intent_id: string | null;
}

export interface SplitDepositTransactionDetails {
  id: string;
  reference_code: string;
  total_amount: number;
  paid_amount: number;
  status: "pending" | "partial_paid" | "fully_paid" | "failed" | "cancelled";
  legs: SplitDepositLeg[];
}
