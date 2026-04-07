import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type {
  StaffAgent,
  RegisterStaffPayload,
} from "@/lib/types/staff.types";

class StaffService {
  async getAllAgencyStaff(): Promise<StaffAgent[]> {
    const res = await api.get<StaffAgent[]>(
      TRAVEL_AGENCY_API.STAFF.LIST_ALL,
    );
    return res.data;
  }

  async registerStaff(payload: RegisterStaffPayload) {
    const res = await api.post(TRAVEL_AGENCY_API.STAFF.REGISTER, payload);
    return res.data;
  }
}

export const staffService = new StaffService();
