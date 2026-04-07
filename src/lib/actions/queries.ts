"use server";

import { getAuthContext } from "./auth-context";
import * as settingsService from "@/lib/services/settings-service";
import * as notificationService from "@/lib/services/notification-service";
import * as userService from "@/lib/services/user-service";
import type {
  Organization, User, Department, Role, Permission, UserRole,
  Notification, ActivityLogEntry,
} from "@/types";

// ── Users + Organizations ──

export async function fetchUsersWithOrgs(): Promise<{ users: User[]; organizations: Organization[] }> {
  const { organizationId } = await getAuthContext();
  return userService.findUsersWithOrgs(organizationId);
}

// ── Departments ──

export async function fetchDepartments(): Promise<Department[]> {
  const { organizationId } = await getAuthContext();
  return settingsService.findAllDepartments(organizationId);
}

// ── Permissions (platform-level, no org filter) ──

export async function fetchPermissions(): Promise<Permission[]> {
  await getAuthContext(); // auth check only
  return userService.findPermissions();
}

// ── Roles ──

export async function fetchRoles(): Promise<Role[]> {
  const { organizationId } = await getAuthContext();
  return userService.findRoles(organizationId);
}

// ── User Roles ──

export async function fetchUserRoles(): Promise<UserRole[]> {
  const { organizationId } = await getAuthContext();
  return userService.findUserRoles(organizationId);
}

// ── Auth bootstrap batch (1 server action instead of 4) ──

export async function fetchAuthBootstrapData(): Promise<{
  currentUserId: string;
  users: User[];
  organizations: Organization[];
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
}> {
  const { userId, organizationId } = await getAuthContext();
  const [usersWithOrgs, roles, permissions, userRoles] = await Promise.all([
    userService.findUsersWithOrgs(organizationId),
    userService.findRoles(organizationId),
    userService.findPermissions(),
    userService.findUserRoles(organizationId),
  ]);
  return { currentUserId: userId, ...usersWithOrgs, roles, permissions, userRoles };
}

// ── Notifications ──

export async function fetchNotifications(): Promise<Notification[]> {
  const { userId, organizationId } = await getAuthContext();
  return notificationService.findByUser(organizationId, userId);
}

// ── Activity Log ──

export async function fetchActivityLog(): Promise<ActivityLogEntry[]> {
  const { organizationId } = await getAuthContext();
  return userService.findActivityLog(organizationId);
}

// ── Users settings batch (4→1) ──

export async function fetchUsersSettingsData(): Promise<{
  users: User[];
  organizations: Organization[];
  roles: Role[];
  userRoles: UserRole[];
  departments: Department[];
}> {
  const { organizationId } = await getAuthContext();
  const [usersWithOrgs, roles, userRoles, departments] = await Promise.all([
    userService.findUsersWithOrgs(organizationId),
    userService.findRoles(organizationId),
    userService.findUserRoles(organizationId),
    settingsService.findAllDepartments(organizationId),
  ]);
  return { ...usersWithOrgs, roles, userRoles, departments };
}

// ── Roles settings batch (2→1) ──

export async function fetchRolesSettingsData(): Promise<{
  roles: Role[];
  permissions: Permission[];
}> {
  const { organizationId } = await getAuthContext();
  const [roles, permissions] = await Promise.all([
    userService.findRoles(organizationId),
    userService.findPermissions(),
  ]);
  return { roles, permissions };
}
