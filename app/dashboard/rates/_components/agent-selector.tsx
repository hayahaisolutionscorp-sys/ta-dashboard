"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgencyAgent } from "@/lib/types/markup.types";

interface AgentSelectorProps {
  agents: AgencyAgent[] | undefined;
  isLoading: boolean;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

export function AgentSelector({
  agents,
  isLoading,
  selectedAgentId,
  onSelectAgent,
}: AgentSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">Agent:</Label>
        <Skeleton className="h-9 w-64" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium whitespace-nowrap">Agent:</Label>
      <Select
        value={selectedAgentId ?? undefined}
        onValueChange={onSelectAgent}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {agents?.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.travel_agent_name}
              <span className="text-muted-foreground ml-1 text-xs">
                ({agent.email})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
