import { createClient } from "@/lib/supabase/client";
import { clearOrgCache } from "@/lib/actions/auth-context";
import { logLogoutEvent } from "@/lib/actions/mutations";

/** Supabase sign-out + hard navigation to login (middleware sees cleared cookies). */
export async function signOutAndGoToLogin(logoutZustand: () => void): Promise<void> {
  try {
    await logLogoutEvent();
  } catch {
    // Best-effort — session may already be expired
  }
  try {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    // No session, env, or network — still clear client state
  }
  logoutZustand();
  // Clear theme sync flag so next login re-applies DB theme
  sessionStorage.removeItem("lp-theme-synced");
  // Clear httpOnly org cookie via server action
  clearOrgCache().catch(() => {});
  window.location.assign("/login");
}
