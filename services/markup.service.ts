import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type {
  MarkupEntity,
  CreateMarkupPayload,
  UpdateMarkupPayload,
} from "@/lib/types/markup.types";

class MarkupService {
  async createMarkup(payload: CreateMarkupPayload): Promise<MarkupEntity> {
    const res = await api.post<MarkupEntity>(
      TRAVEL_AGENCY_API.MARKUP.CREATE,
      payload,
    );
    return res.data;
  }

  async getMarkupsByAgent(agentId: string): Promise<MarkupEntity[]> {
    const res = await api.get<MarkupEntity[]>(
      TRAVEL_AGENCY_API.MARKUP.BY_AGENT(agentId),
    );
    return res.data;
  }

  async getMarkupsByRoute(routeId: number): Promise<MarkupEntity[]> {
    const res = await api.get<MarkupEntity[]>(
      TRAVEL_AGENCY_API.MARKUP.BY_ROUTE(routeId),
    );
    return res.data;
  }

  async getMarkupByAgentAndRoute(
    agentId: string,
    routeId: number,
  ): Promise<MarkupEntity> {
    const res = await api.get<MarkupEntity>(
      TRAVEL_AGENCY_API.MARKUP.BY_AGENT_AND_ROUTE(agentId, routeId),
    );
    return res.data;
  }

  async updateMarkup(
    agentId: string,
    routeId: number,
    payload: UpdateMarkupPayload,
  ): Promise<MarkupEntity> {
    const res = await api.patch<MarkupEntity>(
      TRAVEL_AGENCY_API.MARKUP.UPDATE(agentId, routeId),
      payload,
    );
    return res.data;
  }
}

export const markupService = new MarkupService();
