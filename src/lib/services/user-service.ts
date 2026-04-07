/**
 * User Service — users, orgs, roles, user roles, permissions, activity log.
 * Pure business logic (no Next.js, no Supabase).
 */
import { prisma } from "@/lib/prisma";
import { toISOString, toISOStringOrUndefined } from "@/lib/actions/mappers";
import type {
  Organization, User, Role, Permission, UserRole,
  ActivityLogEntry, ActivityAction, ActivityEntityType,
} from "@/types";

// ── Queries ──

export async function findUsersWithOrgs(organizationId: string): Promise<{ users: User[]; organizations: Organization[] }> {
  const rows = await prisma.userProfile.findMany({
    where: { organizationId },
    include: { organization: true },
  });

  const orgMap = new Map<string, Organization>();
  const users: User[] = [];

  for (const row of rows) {
    const org = row.organization;
    if (!orgMap.has(org.id)) {
      orgMap.set(org.id, {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? undefined,
        plan: org.plan,
        isActive: org.isActive,
        createdAt: toISOString(org.createdAt),
        updatedAt: toISOStringOrUndefined(org.updatedAt),
      });
    }
    users.push({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl ?? undefined,
      theme: row.theme,
      homePage: row.homePage,
      isSuperAdmin: row.isSuperAdmin,
      organizationId: row.organizationId,
      isActive: row.isActive,
      createdAt: toISOString(row.createdAt),
      updatedAt: toISOStringOrUndefined(row.updatedAt),
    });
  }

  return { users, organizations: Array.from(orgMap.values()) };
}

export async function findPermissions(): Promise<Permission[]> {
  const rows = await prisma.permission.findMany();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    groupName: row.groupName,
    description: row.description ?? undefined,
    sortOrder: row.sortOrder,
  }));
}

export async function findRoles(organizationId: string): Promise<Role[]> {
  const rows = await prisma.role.findMany({
    where: { organizationId },
    include: { rolePermissions: true },
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description ?? undefined,
    isSystem: row.isSystem,
    isActive: row.isActive,
    permissionIds: row.rolePermissions.map((rp) => rp.permissionId),
    createdAt: toISOString(row.createdAt),
    createdBy: row.createdBy ?? "",
    updatedAt: toISOStringOrUndefined(row.updatedAt),
    updatedBy: row.updatedBy ?? undefined,
  }));
}

export async function findUserRoles(organizationId: string): Promise<UserRole[]> {
  const rows = await prisma.userRole.findMany({
    where: { organizationId },
    include: { userRoleDepartments: true },
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    roleId: row.roleId,
    departmentIds: row.userRoleDepartments.map((urd) => urd.departmentId),
    createdAt: toISOString(row.createdAt),
    createdBy: row.createdBy ?? "",
  }));
}

export async function findActivityLog(organizationId: string): Promise<ActivityLogEntry[]> {
  const rows = await prisma.activityLog.findMany({
    where: { organizationId },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId ?? undefined,
    action: row.action as ActivityLogEntry["action"],
    entityType: row.entityType as ActivityLogEntry["entityType"],
    entityId: row.entityId,
    entityName: row.entityName ?? undefined,
    changes: row.changes as ActivityLogEntry["changes"],
    metadata: row.metadata as ActivityLogEntry["metadata"],
    createdAt: toISOString(row.createdAt),
  }));
}

/** Lean version: most recent N activity entries for dashboard widget */
export async function findRecentActivity(organizationId: string, limit = 5): Promise<ActivityLogEntry[]> {
  const rows = await prisma.activityLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId ?? undefined,
    action: row.action as ActivityLogEntry["action"],
    entityType: row.entityType as ActivityLogEntry["entityType"],
    entityId: row.entityId,
    entityName: row.entityName ?? undefined,
    changes: row.changes as ActivityLogEntry["changes"],
    metadata: row.metadata as ActivityLogEntry["metadata"],
    createdAt: toISOString(row.createdAt),
  }));
}

// ── Mutations ──

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
  const row = await prisma.activityLog.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId || null,
      action: data.action as never,
      entityType: data.entityType as never,
      entityId: data.entityId,
      entityName: data.entityName || null,
      changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : undefined,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
    },
  });
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId ?? undefined,
    action: row.action as ActivityAction,
    entityType: row.entityType as ActivityEntityType,
    entityId: row.entityId,
    entityName: row.entityName ?? undefined,
    changes: row.changes as Record<string, { old: string; new: string }> | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: toISOString(row.createdAt),
  };
}

export async function updateProfile(
  organizationId: string,
  id: string,
  data: Partial<{
    fullName: string;
    email: string;
    avatarUrl: string;
    theme: string;
    homePage: string;
  }>
): Promise<User> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.homePage !== undefined) updateData.homePage = data.homePage;

  const row = await prisma.userProfile.update({
    where: { id, organizationId },
    data: updateData,
  });
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl ?? undefined,
    theme: row.theme,
    homePage: row.homePage,
    isSuperAdmin: row.isSuperAdmin,
    organizationId: row.organizationId,
    isActive: row.isActive,
    createdAt: toISOString(row.createdAt),
    updatedAt: toISOStringOrUndefined(row.updatedAt),
  } satisfies User;
}

export async function updateOrganization(
  id: string,
  data: Partial<{ name: string; slug: string; logoUrl: string }>
): Promise<Organization> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;

  const row = await prisma.organization.update({
    where: { id },
    data: updateData,
  });
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl ?? undefined,
    plan: row.plan,
    isActive: row.isActive,
    createdAt: toISOString(row.createdAt),
    updatedAt: toISOStringOrUndefined(row.updatedAt),
  } satisfies Organization;
}

export async function deactivateUser(organizationId: string, id: string): Promise<void> {
  await prisma.userProfile.update({
    where: { id, organizationId },
    data: { isActive: false, updatedAt: new Date() },
  });
}

export async function createRole(
  organizationId: string,
  userId: string,
  data: { name: string; description?: string; permissionIds: string[] }
): Promise<Role> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.role.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description || null,
        isSystem: false,
        createdBy: userId,
      },
    });

    if (data.permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: data.permissionIds.map((pid) => ({ roleId: row.id, permissionId: pid })),
      });
    }

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description ?? undefined,
      isSystem: row.isSystem,
      isActive: row.isActive,
      permissionIds: data.permissionIds,
      createdAt: toISOString(row.createdAt),
      createdBy: row.createdBy ?? "",
      updatedAt: toISOStringOrUndefined(row.updatedAt),
      updatedBy: row.updatedBy ?? undefined,
    } satisfies Role;
  });
}

export async function updateRole(
  organizationId: string,
  userId: string,
  id: string,
  data: Partial<{ name: string; description: string; permissionIds: string[] }>
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.role.findUniqueOrThrow({
      where: { id, organizationId },
    });
    if (existing.isSystem) {
      throw new Error("System roles cannot be modified");
    }

    const updateData: Record<string, unknown> = { updatedBy: userId, updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;

    await tx.role.update({ where: { id }, data: updateData });

    if (data.permissionIds !== undefined) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (data.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
        });
      }
    }
  });
}

export async function removeRole(organizationId: string, id: string): Promise<void> {
  const role = await prisma.role.findUniqueOrThrow({
    where: { id, organizationId },
  });
  if (role.isSystem) {
    throw new Error("System roles cannot be deleted");
  }
  await prisma.role.delete({ where: { id } });
}

export async function assignUserRole(
  organizationId: string,
  userId: string,
  data: { userId: string; roleId: string; departmentIds?: string[] }
): Promise<UserRole> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.userRole.create({
      data: {
        organizationId,
        userId: data.userId,
        roleId: data.roleId,
        createdBy: userId,
      },
    });

    const departmentIds = data.departmentIds ?? [];
    if (departmentIds.length > 0) {
      await tx.userRoleDepartment.createMany({
        data: departmentIds.map((did) => ({ userRoleId: row.id, departmentId: did })),
      });
    }

    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      roleId: row.roleId,
      departmentIds,
      createdAt: toISOString(row.createdAt),
      createdBy: row.createdBy ?? "",
    } satisfies UserRole;
  });
}

export async function createUserWithRole(
  organizationId: string,
  createdBy: string,
  data: {
    id: string; // Supabase auth user ID
    email: string;
    fullName: string;
    roleId: string;
    departmentIds?: string[];
  }
): Promise<{ user: User; userRole: UserRole }> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.userProfile.create({
      data: {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        organizationId,
        isActive: true,
        isSuperAdmin: false,
      },
    });

    const urRow = await tx.userRole.create({
      data: {
        organizationId,
        userId: data.id,
        roleId: data.roleId,
        createdBy,
      },
    });

    const departmentIds = data.departmentIds ?? [];
    if (departmentIds.length > 0) {
      await tx.userRoleDepartment.createMany({
        data: departmentIds.map((did) => ({ userRoleId: urRow.id, departmentId: did })),
      });
    }

    const user: User = {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl ?? undefined,
      theme: row.theme,
      homePage: row.homePage,
      isSuperAdmin: row.isSuperAdmin,
      organizationId: row.organizationId,
      isActive: row.isActive,
      createdAt: toISOString(row.createdAt),
      updatedAt: toISOStringOrUndefined(row.updatedAt),
    };

    const userRole: UserRole = {
      id: urRow.id,
      organizationId: urRow.organizationId,
      userId: urRow.userId,
      roleId: urRow.roleId,
      departmentIds,
      createdAt: toISOString(urRow.createdAt),
      createdBy: urRow.createdBy ?? "",
    };

    return { user, userRole };
  });
}

export async function removeUserRole(organizationId: string, id: string): Promise<void> {
  const existing = await prisma.userRole.findUniqueOrThrow({
    where: { id, organizationId },
  });
  if (!existing) throw new Error("User role not found");
  await prisma.userRole.delete({ where: { id } });
}
