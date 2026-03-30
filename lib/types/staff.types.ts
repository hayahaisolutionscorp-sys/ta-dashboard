export interface StaffAgent {
  id: string;
  travel_agent_name: string;
  email: string;
  role: "Admin" | "Staff";
  sync_status: "pending" | "synced" | "failed";
  created_at: string;
}

export interface RegisterStaffPayload {
  travel_agent_name: string;
  email: string;
  password: string;
  contact_number: string;
  address: string;
}
