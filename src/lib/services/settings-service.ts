/**
 * Settings Service — departments.
 * Pure business logic (no Next.js, no Supabase).
 */
import { prisma } from "@/lib/prisma";
import { toISOString, toISOStringOrUndefined } from "@/lib/actions/mappers";
import type { Department } from "@/types";

// ── Departments ──

export async function findAllDepartments(organizationId: string): Promise<Department[]> {
  const rows = await prisma.department.findMany({ where: { organizationId } });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    isActive: row.isActive,
    createdAt: toISOString(row.createdAt),
    createdBy: row.createdBy ?? "",
    updatedAt: toISOStringOrUndefined(row.updatedAt),
    updatedBy: row.updatedBy ?? undefined,
  }));
}

export async function createDepartment(organizationId: string, userId: string, name: string): Promise<Department> {
  const row = await prisma.department.create({
    data: { organizationId, name, createdBy: userId },
  });
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    isActive: row.isActive,
    createdAt: toISOString(row.createdAt),
    createdBy: row.createdBy ?? "",
    updatedAt: toISOStringOrUndefined(row.updatedAt),
    updatedBy: row.updatedBy ?? undefined,
  };
}

export async function updateDepartment(organizationId: string, userId: string, id: string, data: { name: string }): Promise<Department> {
  const row = await prisma.department.update({
    where: { id, organizationId },
    data: { name: data.name, updatedBy: userId, updatedAt: new Date() },
  });
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    isActive: row.isActive,
    createdAt: toISOString(row.createdAt),
    createdBy: row.createdBy ?? "",
    updatedAt: toISOStringOrUndefined(row.updatedAt),
    updatedBy: row.updatedBy ?? undefined,
  };
}

export async function removeDepartment(organizationId: string, id: string): Promise<void> {
  await prisma.department.delete({ where: { id, organizationId } });
}

export async function bulkRemoveDepartments(organizationId: string, ids: string[]): Promise<void> {
  await prisma.department.deleteMany({ where: { id: { in: ids }, organizationId } });
}

// TODO: Add your domain settings services here
