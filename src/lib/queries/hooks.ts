"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  fetchUsersWithOrgs,
  fetchRoles,
  fetchPermissions,
  fetchUserRoles,
  fetchDepartments,
  fetchNotifications,
  fetchActivityLog,
  fetchUsersSettingsData,
  fetchRolesSettingsData,
} from "@/lib/actions/queries";
import type {
  Organization, User, Role, Permission, UserRole,
  Department, Notification, ActivityLogEntry,
} from "@/types";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/** Users + Organizations in one query */
export function useUsersWithOrgsQuery() {
  return useQuery({
    queryKey: queryKeys.usersWithOrgs,
    queryFn: fetchUsersWithOrgs,
    staleTime: STALE_TIME,
  });
}

/** Roles with embedded permissionIds */
export function useRolesQuery() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: fetchRoles,
    staleTime: STALE_TIME,
  });
}

/** Platform permissions */
export function usePermissionsQuery() {
  return useQuery({
    queryKey: queryKeys.permissions,
    queryFn: fetchPermissions,
    staleTime: STALE_TIME,
  });
}

/** User roles with department scoping */
export function useUserRolesQuery() {
  return useQuery({
    queryKey: queryKeys.userRoles,
    queryFn: fetchUserRoles,
    staleTime: STALE_TIME,
  });
}

/** Departments */
export function useDepartmentsQuery() {
  return useQuery<Department[]>({
    queryKey: queryKeys.departments,
    queryFn: fetchDepartments,
    staleTime: STALE_TIME,
  });
}

/** Notifications for a specific user */
export function useNotificationsQuery(userId: string) {
  return useQuery<Notification[]>({
    queryKey: queryKeys.notifications(userId),
    queryFn: fetchNotifications,
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}

/** Activity log entries */
export function useActivityLogQuery() {
  return useQuery<ActivityLogEntry[]>({
    queryKey: queryKeys.activityLog,
    queryFn: fetchActivityLog,
    staleTime: STALE_TIME,
  });
}

/** Users settings batch */
export function useUsersSettingsDataQuery() {
  return useQuery<{
    users: User[];
    organizations: Organization[];
    roles: Role[];
    userRoles: UserRole[];
    departments: Department[];
  }>({
    queryKey: queryKeys.usersWithOrgs,
    queryFn: fetchUsersSettingsData,
    staleTime: STALE_TIME,
  });
}

/** Roles settings batch */
export function useRolesSettingsDataQuery() {
  return useQuery<{
    roles: Role[];
    permissions: Permission[];
  }>({
    queryKey: queryKeys.roles,
    queryFn: fetchRolesSettingsData,
    staleTime: STALE_TIME,
  });
}
