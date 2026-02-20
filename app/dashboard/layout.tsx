"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isAuthenticated } from "@/lib/auth-cookies";

// Always false on server, true on client — no setState needed
const useIsMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const storeAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mounted = useIsMounted();

  useEffect(() => {
    if (!storeAuthenticated && !isAuthenticated()) {
      router.replace("/login");
    }
  }, [storeAuthenticated, router]);

  // Server render & first client paint: return null to avoid hydration mismatch
  if (!mounted) return null;

  // After hydration: block unauthenticated users
  if (!storeAuthenticated && !isAuthenticated()) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
