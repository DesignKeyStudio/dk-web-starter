"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PERMISSIONS, ROLE_DEFINITIONS } from "@/lib/constants/permissions";
import { slugify, emailLocalPart } from "@/lib/utils";
import { redirect } from "next/navigation";

interface RegistrationInput {
  orgName: string;
  fullName: string;
  email: string;
  password: string;
}

interface RegistrationResult {
  success: boolean;
  error?: string;
}

/**
 * Creates a Supabase auth user + org + profile + system roles in a single
 * Prisma transaction. Auth user is cleaned up on any failure.
 */
export async function commitRegistration(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const adminSupabase = createAdminClient();
  let userId: string | null = null;

  try {
    // ── Input validation ──
    const email = input.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return { success: false, error: "Valid email is required" };
    }

    if (!input.orgName?.trim() || input.orgName.trim().length < 2) {
      return { success: false, error: "Organization name must be at least 2 characters" };
    }

    if (!input.password || input.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const orgSlug = slugify(input.orgName.trim());
    const fullName = input.fullName?.trim() || emailLocalPart(email);

    // Pre-flight: check for existing email or slug conflict
    const [existingEmail, existingSlug] = await Promise.all([
      prisma.userProfile.findFirst({ where: { email }, select: { id: true } }),
      prisma.organization.findFirst({ where: { slug: orgSlug }, select: { id: true } }),
    ]);

    if (existingEmail) {
      return { success: false, error: "An account with this email already exists" };
    }
    if (existingSlug) {
      return { success: false, error: "An organization with this name already exists" };
    }

    // ── Create Supabase auth user ──
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message ?? "Failed to create user" };
    }
    userId = authData.user.id;

    // ── Prisma transaction: org + profile + permissions + roles + user role ──
    await prisma.$transaction(async (tx) => {
      // 1. Create organization
      const org = await tx.organization.create({
        data: {
          name: input.orgName.trim(),
          slug: orgSlug,
          plan: "free",
        },
      });

      // 2. Create user profile
      await tx.userProfile.create({
        data: {
          id: userId!,
          email,
          fullName,
          organizationId: org.id,
          homePage: "/dashboard",
          theme: "light",
        },
      });

      // 3. Seed permissions (idempotent upsert)
      for (const perm of DEFAULT_PERMISSIONS) {
        await tx.permission.upsert({
          where: { groupName_name: { groupName: perm.groupName, name: perm.name } },
          update: {},
          create: { name: perm.name, groupName: perm.groupName, sortOrder: 0 },
        });
      }

      // 4. Create 4 system roles + link permissions + assign Admin to new user
      for (const roleDef of ROLE_DEFINITIONS) {
        const role = await tx.role.create({
          data: {
            organizationId: org.id,
            name: roleDef.name,
            isSystem: true,
            isActive: true,
            createdBy: userId!,
          },
        });

        // Link permissions by "GroupName:PermName" key
        for (const permKey of roleDef.permissions) {
          const [groupName, permName] = permKey.split(":");
          const perm = await tx.permission.findUnique({
            where: { groupName_name: { groupName, name: permName } },
          });
          if (perm) {
            await tx.rolePermission
              .create({ data: { roleId: role.id, permissionId: perm.id } })
              .catch(() => { /* ignore duplicate */ });
          }
        }

        // Assign Admin role to the registering user
        if (roleDef.name === "Admin") {
          await tx.userRole.create({
            data: {
              organizationId: org.id,
              userId: userId!,
              roleId: role.id,
              createdBy: userId!,
            },
          });
        }
      }
    }, { timeout: 30000 });

    // ── Sign in immediately after registration ──
    const browserSupabase = await createClient();
    const { error: signInError } = await browserSupabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (signInError) {
      // Account created — sign-in failed, let the user log in manually
      return { success: false, error: "Account created but sign-in failed. Please log in." };
    }

    return { success: true };
  } catch (err) {
    // Clean up auth user if Prisma transaction failed
    if (userId) {
      try {
        await adminSupabase.auth.admin.deleteUser(userId);
      } catch {
        // Best-effort cleanup
      }
    }
    return { success: false, error: err instanceof Error ? err.message : "Registration failed" };
  }
}
