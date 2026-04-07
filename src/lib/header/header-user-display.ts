import { emailLocalPart } from "@/lib/utils";
import type { PlatformServerUser, User } from "@/types";

/** Header label: demo store user first, else server (Supabase) snapshot. */
export function resolveHeaderDisplay(
  user: User | null,
  serverUser: PlatformServerUser | null,
): { displayName: string; displayEmail: string } {
  const displayName =
    user?.fullName ??
    serverUser?.name ??
    (serverUser?.email ? emailLocalPart(serverUser.email) : null) ??
    (user?.email ? emailLocalPart(user.email) : null) ??
    "Account";
  const displayEmail = user?.email ?? serverUser?.email ?? "";
  return { displayName, displayEmail };
}
