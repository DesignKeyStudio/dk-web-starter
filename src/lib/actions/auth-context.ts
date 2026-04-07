"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export interface AuthContext {
  userId: string;
  organizationId: string;
}

const ORG_COOKIE = "lp-org-id";

/**
 * Get the current user's auth context (userId + organizationId).
 * Replaces Supabase RLS — every server action calls this to scope queries.
 *
 * Optimized: caches organizationId in a cookie after first DB lookup,
 * saving ~800ms on subsequent server action calls within the same session.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  // Try cached orgId from cookie (avoids DB round-trip)
  const cookieStore = await cookies();
  const cachedOrgId = cookieStore.get(ORG_COOKIE)?.value;

  if (cachedOrgId) {
    return { userId: user.id, organizationId: cachedOrgId };
  }

  // First call — look up org from DB and cache it
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { id: true, organizationId: true },
  });

  if (!profile) {
    throw new Error("User profile not found");
  }

  // Cache for future requests (httpOnly, same session lifetime)
  try {
    cookieStore.set(ORG_COOKIE, profile.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  } catch {
    // Called from Server Component render — cookie set not allowed, ignore
  }

  return { userId: profile.id, organizationId: profile.organizationId };
}

/** Clear cached orgId cookie on logout */
export async function clearOrgCache(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ORG_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  } catch {
    // ignore — may be called from client context
  }
}
