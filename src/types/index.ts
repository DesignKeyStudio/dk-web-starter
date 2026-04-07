// ============================================================
// DK-Launchpad — Base Entity Type Definitions
// Platform types: Organization, RBAC, Departments,
// Notifications, ActivityLog
// ============================================================

// --- Platform Types ---

/** Supabase session snapshot from server layout (header, no client flash). */
export type PlatformServerUser = {
  email: string;
  name: string | null;
};

export type OrgPlan = 'free' | 'paid';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: OrgPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  theme: 'light' | 'dark';
  homePage: string;
  isSuperAdmin: boolean;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// --- Tenant Types ---

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissionIds: string[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Permission {
  id: string;
  name: string;
  groupName: string;
  description?: string;
  sortOrder: number;
}

export interface UserRole {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  departmentIds: string[];
  createdAt: string;
  createdBy: string;
}

// --- Notification Types ---

// TODO: Update with your domain notification types
export type NotificationType = 'status_change' | 'system';
export type NotificationReferenceType = 'system';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceType?: NotificationReferenceType;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// --- Activity Log Types ---

// TODO: Add domain-specific actions (status_changed, approved, etc.)
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'logged_in' | 'logged_out';

// TODO: Add your domain entity types (subscription, vendor, invoice, etc.)
export type ActivityEntityType = 'user' | 'role' | 'department' | 'organization';

export interface ActivityLogEntry {
  id: string;
  organizationId: string;
  userId?: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, { old: string; new: string }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// --- Permission group/action constants ---

// TODO: Update with your domain permission groups
export const PERMISSION_GROUPS = [
  'Dashboard',
  'Settings',
  'Notifications',
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];
