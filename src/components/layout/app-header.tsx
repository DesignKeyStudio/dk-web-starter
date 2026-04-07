"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppHeader } from "@/hooks/use-app-header";
import { HeaderUserMenu } from "@/components/layout/header-user-menu";
import type { PlatformServerUser } from "@/types";
import { useEffect, useState } from "react";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function AppHeader({ serverUser }: { serverUser: PlatformServerUser | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { toggleSidebar } = useSidebar();
  const {
    theme,
    toggleTheme,
    unreadCount,
    displayName,
    displayEmail,
    avatarInitials,
    onSignOut,
  } = useAppHeader(serverUser);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar} title="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={toggleTheme} title={mounted ? `Switch to ${theme === "light" ? "dark" : "light"} mode` : undefined}>
        {mounted ? (theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />) : <div className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="icon" className="relative" asChild>
        <Link href="/notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Link>
      </Button>

      <HeaderUserMenu
        displayName={displayName}
        displayEmail={displayEmail}
        avatarInitials={avatarInitials}
        onSignOut={onSignOut}
      />
    </header>
  );
}
