/**
 * Markup mutation hooks.
 *
 *  useCreateMarkup()
 *    Creates a new markup record for an agent × route pair.
 *    On success, invalidates the agent and route markup caches so the
 *    rates page list and form default both reflect the new value.
 *
 *  useUpdateMarkup()
 *    Updates the flat_passenger_markup on an existing agent × route record.
 *    On success, invalidates the agent, route, and agent×route caches
 *    so all consumers (list, form default, booking pre-fill) refresh.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markupService } from "@/services/markup.service";
import type {
  CreateMarkupPayload,
  UpdateMarkupPayload,
} from "@/lib/types/markup.types";

export function useCreateMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMarkupPayload) =>
      markupService.createMarkup(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["markups", "agent", data.travel_agent_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["markups", "route", data.travel_agency_route_id],
      });
    },
  });
}

export function useUpdateMarkup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      routeId,
      payload,
    }: {
      agentId: string;
      routeId: number;
      payload: UpdateMarkupPayload;
    }) => markupService.updateMarkup(agentId, routeId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["markups", "agent", data.travel_agent_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["markups", "route", data.travel_agency_route_id],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "markups",
          "agent",
          data.travel_agent_id,
          "route",
          data.travel_agency_route_id,
        ],
      });
    },
  });
}
