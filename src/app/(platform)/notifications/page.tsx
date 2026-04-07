"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useNotificationsQuery } from "@/lib/queries/hooks";
import { queryKeys } from "@/lib/queries/keys";
import { useQueryClient } from "@tanstack/react-query";
import {
  markNotificationAsRead,
  markAllNotificationsRead,
} from "@/lib/actions/mutations";
import { PageHeader } from "@/components/custom/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Notification, NotificationType } from "@/types";

const TYPE_OPTIONS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "status_change", label: "Status Changes" },
  { value: "system", label: "System" },
];

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "status_change":
      return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    case "system":
      return <Info className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function getNotificationHref(_n: Notification): string | null {
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission("Notifications", "Manage");

  const queryClient = useQueryClient();
  const { data: rqNotifications, isLoading } = useNotificationsQuery(currentUserId ?? "");

  const allNotifications = useMemo(() => {
    return (rqNotifications ?? []).slice().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rqNotifications]);

  // Filter by type
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const filteredNotifications = useMemo(() => {
    if (typeFilter === "all") return allNotifications;
    return allNotifications.filter((n) => n.type === typeFilter);
  }, [allNotifications, typeFilter]);

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  // Loading state for mark-all
  const [markingAll, setMarkingAll] = useState(false);
  // Track individual marking
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  async function handleMarkAsRead(id: string) {
    setMarkingIds((prev) => new Set(prev).add(id));
    const qk = queryKeys.notifications(currentUserId ?? "");
    // Optimistic update: mark this notification as read in cache immediately
    const previous = queryClient.getQueryData<Notification[]>(qk);
    if (previous) {
      queryClient.setQueryData<Notification[]>(qk, previous.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ));
    }
    try {
      await markNotificationAsRead(id);
      queryClient.invalidateQueries({ queryKey: qk });
    } catch {
      // Rollback on error
      if (previous) queryClient.setQueryData(qk, previous);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleMarkAllRead() {
    if (!currentUserId) return;
    setMarkingAll(true);
    const qk = queryKeys.notifications(currentUserId);
    // Optimistic update: mark all notifications as read in cache immediately
    const previous = queryClient.getQueryData<Notification[]>(qk);
    if (previous) {
      queryClient.setQueryData<Notification[]>(qk, previous.map((n) => ({ ...n, isRead: true })));
    }
    try {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: qk });
    } catch {
      // Rollback on error
      if (previous) queryClient.setQueryData(qk, previous);
    } finally {
      setMarkingAll(false);
    }
  }

  function handleNotificationClick(n: Notification) {
    if (canManage && !n.isRead) {
      handleMarkAsRead(n.id);
    }
    const href = getNotificationHref(n);
    if (href) {
      router.push(href);
    }
  }

  const subtitle =
    unreadCount > 0
      ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
      : "All caught up!";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" subtitle="Loading..." />
        <Card>
          <CardContent className="p-0 divide-y">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-4 w-4 mt-0.5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as NotificationType | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                {markingAll ? "Marking..." : "Mark all read"}
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8" />
              <p>
                {typeFilter !== "all"
                  ? "No notifications match this filter"
                  : "You're all caught up! No notifications yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((n) => {
                const href = getNotificationHref(n);
                const isMarking = markingIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-4 transition-colors ${
                      !n.isRead ? "bg-muted/50" : ""
                    } ${href ? "cursor-pointer hover:bg-accent/50" : ""}`}
                    onClick={() => handleNotificationClick(n)}
                    role={href ? "link" : undefined}
                    tabIndex={href ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (href && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleNotificationClick(n);
                      }
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{n.title}</span>
                        {!n.isRead && (
                          <Badge variant="default" className="text-[10px] px-1 py-0 shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {canManage && !n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        disabled={isMarking}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        {isMarking ? "..." : "Mark read"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
