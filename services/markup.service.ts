/**
 * MarkupService — manages per-agent, per-route markup configurations.
 *
 * A markup is a flat fee (flat_passenger_markup) added on top of the base
 * passenger fare when a travel agent creates a booking. Each markup record is
 * scoped to a single agent × route pair so agents can have different markups
 * for different routes.
 *
 * Usage in the booking flow:
 *  - On the create-booking page, useMarkupByAgentAndRoute() fetches the
 *    agent's configured markup for the selected route and pre-fills the
 *    ta_markup field in the booking form.
 *  - The markup value is sent with the booking payload and applied by the
 *    client API when calculating the total charged to the passenger.
 *  - Markups are managed on the /dashboard/rates page via the markup section.
 */
import { api } from "@/lib/api";
import { TRAVEL_AGENCY_API } from "@/constants/api_config";
import type {
  MarkupEntity,
  CreateMarkupPayload,
  UpdateMarkupPayload,
} from "@/lib/types/markup.types";

class MarkupService {
  /**
   * Create a new markup record for an agent × route pair.
   * Fails if a record for the same pair already exists — use updateMarkup instead.
   */
  async createMarkup(payload: CreateMarkupPayload): Promise<MarkupEntity> {
    const res = await api.post<MarkupEntity>(
      TRAVEL_AGENCY_API.MARKUP.CREATE,
      payload,
    );
    return res.data;
  }

  /** Fetch all markup records configured for a specific agent (across all routes). */
  async getMarkupsByAgent(agentId: string): Promise<MarkupEntity[]> {
    const res = await api.get<MarkupEntity[]>(
      TRAVEL_AGENCY_API.MARKUP.BY_AGENT(agentId),
    );
    return res.data;
  }

  /** Fetch all markup records configured for a specific route (across all agents). */
  async getMarkupsByRoute(routeId: number): Promise<MarkupEntity[]> {
    const res = await api.get<MarkupEntity[]>(
      TRAVEL_AGENCY_API.MARKUP.BY_ROUTE(routeId),
    );
    return res.data;
  }

  /**
   * Fetch the single markup record for an agent × route pair.
   * Returns 404 when no markup has been configured yet — callers should
   * treat a 404 as "no markup" (i.e. default to 0) rather than an error.
   */
  async getMarkupByAgentAndRoute(
    agentId: string,
    routeId: number,
  ): Promise<MarkupEntity> {
    const res = await api.get<MarkupEntity>(
      TRAVEL_AGENCY_API.MARKUP.BY_AGENT_AND_ROUTE(agentId, routeId),
    );
    return res.data;
  }

  /** Update the markup flat fee for an existing agent × route record. */
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
