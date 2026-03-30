"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconTicket,
  IconSpeedboatFilled,
  IconSettings,
  IconHelp,
  IconLogout,
  IconZoomMoney,
  IconWallet,
  IconUsers,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLogout } from "@/services/auth.service";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Book Trip",
    url: "/dashboard/book",
    icon: IconSpeedboatFilled,
  },
  {
    title: "My Bookings",
    url: "/dashboard/bookings",
    icon: IconTicket,
  },
  {
    title: "Rates",
    url: "/dashboard/rates",
    icon: IconZoomMoney,
  },
  {
    title: "Wallet",
    url: "/dashboard/wallet",
    icon: IconWallet,
  },
  {
    title: "Staff",
    url: "/dashboard/staff",
    icon: IconUsers,
    requiredRole: "Admin" as const,
  },
];

const secondaryItems = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
  },
  {
    title: "Help",
    url: "/dashboard/help",
    icon: IconHelp,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Image
                    src="/ayahay-icon.png"
                    alt="Hayahai"
                    width={24}
                    height={24}
                    className="rounded"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Hayahai Travel</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Travel Agency
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter(
                  (item) =>
                    !("requiredRole" in item) ||
                    item.requiredRole === user?.role,
                )
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {user?.travel_agent_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.travel_agent_name || "Travel Agent"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "agent@example.com"}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <IconLogout className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
