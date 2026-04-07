export interface BookingReportRow {
  reference_no: string;
  booked_by_agent_name: string | null;
  booking_status: string;
  booking_type: string;
  route_summary: string;
  payment_method: string;
  total_passengers: number;
  total_cargo_items: number;
  total_price: number;
  ta_markup: number;
  booking_created_at: string;
}

export interface WalletActivityRow {
  date: string;
  type: string;
  amount: number;
  reference: string;
  performed_by: string | null;
}

export interface AgencyPerformanceData {
  agency_name: string;
  date_range: { from: string; to: string };
  generated_at: string;
  generated_by: string;

  summary: {
    total_bookings: number;
    total_passengers: number;
    total_cargo_items: number;
    total_revenue: number;
    total_markup_earned: number;
    total_base_price: number;
  };

  booking_breakdown_by_status: Record<string, number>;
  booking_breakdown_by_route: Record<
    string,
    { count: number; revenue: number; markup: number }
  >;
  booking_breakdown_by_payment_method: Record<
    string,
    { count: number; revenue: number }
  >;

  wallet_summary: {
    total_deposits: number;
    total_usage: number;
    current_balance: number;
    transaction_count: number;
  };

  wallet_activity: WalletActivityRow[];
  bookings: BookingReportRow[];
}

export interface StaffMetricRow {
  agent_id: string;
  agent_name: string;
  email: string;
  total_bookings: number;
  total_passengers: number;
  total_cargo_items: number;
  total_revenue: number;
  total_markup_earned: number;
  wallet_transactions: number;
  wallet_usage: number;
}

export interface StaffPerformanceData {
  agency_name: string;
  date_range: { from: string; to: string };
  generated_at: string;
  generated_by: string;

  staff_summary: StaffMetricRow[];

  staff_details: Record<
    string,
    {
      bookings: BookingReportRow[];
      wallet_activity: WalletActivityRow[];
    }
  >;
}

export interface GenerateReportParams {
  date_from: string;
  date_to: string;
  format: "pdf" | "excel";
}

export interface ReportDataParams {
  date_from: string;
  date_to: string;
}
