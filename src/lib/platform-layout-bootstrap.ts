import { useAuthStore } from "@/lib/stores/auth-store";
import { fetchAuthBootstrapData } from "@/lib/actions/queries";

/**
 * Initialize platform stores.
 * Single server action returns currentUserId (verified server-side)
 * + users/orgs/roles/permissions. No client-side supabase.auth.getUser() needed.
 */
export async function bootstrapPlatformClientStores(): Promise<void> {
  const data = await fetchAuthBootstrapData();

  const hasMatchingUser = data.users.some((u) => u.id === data.currentUserId);
  if (!hasMatchingUser) {
    throw new Error(`Bootstrap: no user_profile matches currentUserId: ${data.currentUserId}`);
  }

  useAuthStore.setState({
    users: data.users,
    organizations: data.organizations,
    roles: data.roles,
    permissions: data.permissions,
    userRoles: data.userRoles,
    currentUserId: data.currentUserId,
    initialized: true,
  });
}
