"use server";

import { getAuthContext } from "./auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import * as settingsService from "@/lib/services/settings-service";
import * as notificationService from "@/lib/services/notification-service";
import * as userService from "@/lib/services/user-service";
import type {
  ActivityLogEntry, ActivityAction, ActivityEntityType,
  Department, Notification, User, Role, UserRole, Organization,
} from "@/types";

// ── Activity Log ──

export async function insertActivityLog(data: {
  organizationId: string;
  userId?: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, { old: string; new: string }>;
  metadata?: Record<string, unknown>;
}): Promise<ActivityLogEntry> {
  const { organizationId } = await getAuthContext();
  return userService.insertActivityLog({ ...data, organizationId });
}

export async function logLoginEvent(): Promise<void> {
  const { userId, organizationId } = await getAuthContext();
  await userService.insertActivityLog({
    organizationId,
    userId,
    action: "logged_in",
    entityType: "user",
    entityId: userId,
    entityName: "Login",
  });
}

export async function logLogoutEvent(): Promise<void> {
  const { userId, organizationId } = await getAuthContext();
  await userService.insertActivityLog({
    organizationId,
    userId,
    action: "logged_out",
    entityType: "user",
    entityId: userId,
    entityName: "Logout",
  });
}

// ── Department Mutations ──

export async function createDepartment(name: string): Promise<Department> {
  const { userId, organizationId } = await getAuthContext();
  return settingsService.createDepartment(organizationId, userId, name);
}

export async function updateDepartment(id: string, data: { name: string }): Promise<Department> {
  const { userId, organizationId } = await getAuthContext();
  return settingsService.updateDepartment(organizationId, userId, id, data);
}

export async function deleteDepartment(id: string): Promise<void> {
  const { organizationId } = await getAuthContext();
  return settingsService.removeDepartment(organizationId, id);
}

export async function bulkDeleteDepartments(ids: string[]): Promise<void> {
  const { organizationId } = await getAuthContext();
  return settingsService.bulkRemoveDepartments(organizationId, ids);
}

// ── Notification Mutations ──

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<Notification> {
  const { organizationId } = await getAuthContext();
  return notificationService.create(organizationId, data);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { organizationId } = await getAuthContext();
  return notificationService.markAsRead(organizationId, id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { userId, organizationId } = await getAuthContext();
  return notificationService.markAllRead(organizationId, userId);
}

export async function deleteNotification(id: string): Promise<void> {
  const { organizationId } = await getAuthContext();
  return notificationService.remove(organizationId, id);
}

// ── User & Role Management Mutations ──

export async function updateUserProfile(
  id: string,
  data: Partial<{
    fullName: string;
    email: string;
    avatarUrl: string;
    theme: string;
    homePage: string;
  }>
): Promise<User> {
  const { organizationId } = await getAuthContext();
  return userService.updateProfile(organizationId, id, data);
}

export async function updateOrganization(
  id: string,
  data: Partial<{ name: string; slug: string; logoUrl: string }>
): Promise<Organization> {
  const { organizationId } = await getAuthContext();
  if (id !== organizationId) throw new Error("Forbidden");
  return userService.updateOrganization(id, data);
}

export async function createRole(data: {
  name: string;
  description?: string;
  permissionIds: string[];
}): Promise<Role> {
  const { userId, organizationId } = await getAuthContext();
  return userService.createRole(organizationId, userId, data);
}

export async function updateRole(
  id: string,
  data: Partial<{ name: string; description: string; permissionIds: string[] }>
): Promise<void> {
  const { userId, organizationId } = await getAuthContext();
  return userService.updateRole(organizationId, userId, id, data);
}

export async function deleteRole(id: string): Promise<void> {
  const { organizationId } = await getAuthContext();
  return userService.removeRole(organizationId, id);
}

export async function assignUserRole(data: {
  userId: string;
  roleId: string;
  departmentIds?: string[];
}): Promise<UserRole> {
  const { userId: currentUserId, organizationId } = await getAuthContext();
  return userService.assignUserRole(organizationId, currentUserId, data);
}

export async function removeUserRole(id: string): Promise<void> {
  const { organizationId } = await getAuthContext();
  return userService.removeUserRole(organizationId, id);
}

export async function inviteUser(data: {
  fullName: string;
  email: string;
  roleId: string;
  departmentIds?: string[];
}): Promise<User> {
  const { userId, organizationId } = await getAuthContext();

  // 1. Create the auth user via Supabase admin invite
  const supabaseAdmin = createAdminClient();
  const { data: authData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    data.email,
    { data: { full_name: data.fullName } }
  );

  if (error || !authData.user) {
    throw new Error(error?.message ?? "Failed to invite user");
  }

  // 2. Create user profile + role assignment in the database
  const { user } = await userService.createUserWithRole(
    organizationId,
    userId,
    {
      id: authData.user.id,
      email: data.email,
      fullName: data.fullName,
      roleId: data.roleId,
      departmentIds: data.departmentIds,
    }
  );

  // 3. Log the invite activity
  await userService.insertActivityLog({
    organizationId,
    userId,
    action: "created",
    entityType: "user",
    entityId: user.id,
    entityName: data.fullName,
    metadata: { event: "invite", invitedEmail: data.email },
  });

  return user;
}

export async function deactivateUser(id: string): Promise<void> {
  const { organizationId } = await getAuthContext();
  return userService.deactivateUser(organizationId, id);
}

// TODO: Add your domain mutations here
