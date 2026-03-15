/**
 * Markup query hooks.
 *
 *  useMarkupsByAgent(agentId)
 *    Fetches all markup records for an agent across all routes.
 *    Used on the /dashboard/rates page to display and manage an agent's markups.
 *
 *  useMarkupsByRoute(routeId)
 *    Fetches all markup records for a route across all agents.
 *    Useful for admin views showing per-route markup configurations.
 *
 *  useMarkupByAgentAndRoute(agentId, routeId)
 *    Fetches the single markup for an agent × route pair.
 *    Used on the create-booking page to pre-fill ta_markup in the form.
 *    Returns null on 404 (no markup configured) — callers should default to 0.
 */
import { useQuery } from "@tanstack/react-query";
import { markupService } from "@/services/markup.service";

export function useMarkupsByAgent(agentId: string | undefined) {
  return useQuery({
    queryKey: ["markups", "agent", agentId],
    queryFn: () => markupService.getMarkupsByAgent(agentId!),
    enabled: !!agentId,
  });
}

export function useMarkupsByRoute(routeId: number | undefined) {
  return useQuery({
    queryKey: ["markups", "route", routeId],
    queryFn: () => markupService.getMarkupsByRoute(routeId!),
    enabled: routeId != null && routeId > 0,
  });
}

export function useMarkupByAgentAndRoute(
  agentId: string | undefined,
  routeId: number | undefined,
) {
  return useQuery({
    queryKey: ["markups", "agent", agentId, "route", routeId],
    queryFn: async () => {
      try {
        return await markupService.getMarkupByAgentAndRoute(agentId!, routeId!);
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!agentId && routeId != null && routeId > 0,
  });
}
