"use client";

import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useNotificationsQuery } from "@/lib/queries/hooks";
import { getInitials } from "@/lib/utils";
import { resolveHeaderDisplay } from "@/lib/header/header-user-display";
import { signOutAndGoToLogin } from "@/lib/header/header-auth-actions";
import type { PlatformServerUser } from "@/types";

export function useAppHeader(serverUser: PlatformServerUser | null) {
  const logout = useAuthStore((s) => s.logout);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const users = useAuthStore((s) => s.users);
  const organizations = useAuthStore((s) => s.organizations);
  const { theme: currentTheme, setTheme } = useTheme();

  const user = currentUserId ? users.find((u) => u.id === currentUserId) ?? null : null;
  const org = user ? organizations.find((o) => o.id === user.organizationId) ?? organizations[0] ?? null : organizations[0] ?? null;
  const notifQuery = useNotificationsQuery(currentUserId ?? "");
  const unreadCount = (() => {
    if (!currentUserId) return 0;
    if (notifQuery.isLoading) return 0;
    return (notifQuery.data ?? []).filter((n) => !n.isRead).length;
  })();

  const { displayName, displayEmail } = resolveHeaderDisplay(user, serverUser);
  const avatarInitials = getInitials(user?.fullName, user?.email ?? serverUser?.email ?? undefined);

  const theme = (currentTheme ?? "light") as "light" | "dark";

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (user) {
      useAuthStore.getState().updateUserTheme(newTheme);
    }
  };

  return {
    organizationName: org?.name,
    theme,
    toggleTheme,
    unreadCount,
    displayName,
    displayEmail,
    avatarInitials,
    onSignOut: () => signOutAndGoToLogin(logout),
  };
}
