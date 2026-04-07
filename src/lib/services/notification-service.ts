/**
 * Notification Service — pure business logic (no Next.js, no Supabase).
 */
import { prisma } from "@/lib/prisma";
import { toISOString, toISOStringOrUndefined } from "@/lib/actions/mappers";
import type { Notification } from "@/types";
import type { notification_type, notification_reference_type } from "@prisma/client";

// ── Queries ──

export async function findByUser(organizationId: string, userId: string): Promise<Notification[]> {
  const rows = await prisma.notification.findMany({
    where: { organizationId, userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body ?? undefined,
    referenceType: row.referenceType ?? undefined,
    referenceId: row.referenceId ?? undefined,
    isRead: row.isRead,
    readAt: toISOStringOrUndefined(row.readAt),
    createdAt: toISOString(row.createdAt),
  }));
}

// ── Mutations ──

export async function create(
  organizationId: string,
  data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<Notification> {
  const row = await prisma.notification.create({
    data: {
      organizationId,
      userId: data.userId,
      type: data.type as notification_type,
      title: data.title,
      body: data.body || null,
      referenceType: data.referenceType ? (data.referenceType as notification_reference_type) : null,
      referenceId: data.referenceId || null,
    },
  });
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body ?? undefined,
    referenceType: row.referenceType ?? undefined,
    referenceId: row.referenceId ?? undefined,
    isRead: row.isRead,
    readAt: toISOStringOrUndefined(row.readAt),
    createdAt: toISOString(row.createdAt),
  } satisfies Notification;
}

export async function markAsRead(organizationId: string, id: string): Promise<void> {
  await prisma.notification.update({
    where: { id, organizationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(organizationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { organizationId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function remove(organizationId: string, id: string): Promise<void> {
  await prisma.notification.delete({ where: { id, organizationId } });
}
