import { createClient } from "@/lib/supabase/server";
import type { PlatformServerUser } from "@/types";

/** Extract display name from Supabase user_metadata, preferring full_name over name. */
export function metadataDisplayName(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  for (const key of ["full_name", "name"] as const) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Session user for platform shell (header). Safe when env/client is missing. */
export async function getPlatformServerUser(): Promise<PlatformServerUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return {
      email: user.email,
      name: metadataDisplayName(user.user_metadata),
    };
  } catch {
    return null;
  }
}
