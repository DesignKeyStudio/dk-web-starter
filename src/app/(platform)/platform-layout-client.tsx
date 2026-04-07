"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { PlatformShellLoader } from "@/components/layout/platform-shell-loader";
import { bootstrapPlatformClientStores } from "@/lib/platform-layout-bootstrap";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { PlatformServerUser } from "@/types";

export function PlatformLayoutClient({
  children,
  serverUser,
}: {
  children: React.ReactNode;
  serverUser: PlatformServerUser | null;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    bootstrapPlatformClientStores()
      .then(() => {
        // Apply DB theme only once per session (on login).
        // On page refresh, next-themes reads from localStorage automatically.
        const themeSynced = sessionStorage.getItem("lp-theme-synced");
        if (!themeSynced) {
          const state = useAuthStore.getState();
          const user = state.currentUserId
            ? state.users.find((u) => u.id === state.currentUserId)
            : null;
          if (user?.theme) {
            setTheme(user.theme);
          }
          sessionStorage.setItem("lp-theme-synced", "1");
        }
        setReady(true);
      })
      .catch((err) => {
        console.error("Platform bootstrap failed:", err);
        router.push("/login");
      });
  }, [router, setTheme]);

  if (!ready) {
    return <PlatformShellLoader />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader serverUser={serverUser} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
