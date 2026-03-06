"use client";

import { IconRoute, IconChevronDown, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RouteEntity } from "@/constants/entities/route.entity";

interface RouteSelectorProps {
  routes: RouteEntity[] | undefined;
  routesLoading: boolean;
  activeRouteCode: string | null;
  onSelectRoute: (code: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
}

export function RouteSelector({
  routes,
  routesLoading,
  activeRouteCode,
  onSelectRoute,
  search,
  onSearchChange,
  isLoading,
}: RouteSelectorProps) {
  const selectedRoute = routes?.find(
    (r) => `${r.src_port_code}-${r.dest_port_code}` === activeRouteCode,
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between sm:w-64"
            disabled={routesLoading || !routes?.length}
          >
            <span className="flex items-center gap-2">
              <IconRoute className="h-4 w-4 shrink-0" />
              {routesLoading
                ? "Loading routes…"
                : selectedRoute
                  ? `${selectedRoute.src_port_name} → ${selectedRoute.dest_port_name}`
                  : (activeRouteCode ?? "Select a route")}
            </span>
            <IconChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          {routes?.map((route) => {
            const code = `${route.src_port_code}-${route.dest_port_code}`;
            return (
              <DropdownMenuItem
                key={route.tenant_routes_id}
                onSelect={() => onSelectRoute(code)}
              >
                <IconRoute className="mr-2 h-4 w-4" />
                {route.src_port_name} → {route.dest_port_name}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {code}
                </Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative flex-1">
        <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by type, class, or operator…"
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={!activeRouteCode || isLoading}
        />
      </div>
    </div>
  );
}
