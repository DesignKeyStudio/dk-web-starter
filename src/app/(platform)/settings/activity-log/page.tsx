"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useActivityLogQuery } from "@/lib/queries/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, SortableHeader } from "@/components/data-table";
import { PageHeader } from "@/components/custom/page-header";
import { Activity, Plus, Pencil, Trash2, LogIn, LogOut } from "lucide-react";
import type { ActivityLogEntry, ActivityAction, ActivityEntityType } from "@/types";
const ACTION_LABELS: Record<ActivityAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  logged_in: "Logged In",
  logged_out: "Logged Out",
};

const ACTION_VARIANT: Record<ActivityAction, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  logged_in: "default",
  logged_out: "secondary",
};

const ACTION_ICONS: Record<ActivityAction, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  logged_in: LogIn,
  logged_out: LogOut,
};

const ENTITY_LABELS: Record<ActivityEntityType, string> = {
  user: "User",
  role: "Role",
  department: "Department",
  organization: "Organization",
};

const ENTITY_ROUTES: Partial<Record<ActivityEntityType, string>> = {};

export default function ActivityLogSettingsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const users = useAuthStore((s) => s.users);

  const { data: realEntries } = useActivityLogQuery();

  const entries = realEntries ?? [];

  const canView = hasPermission("Settings", "Edit Settings");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  const getUserName = (userId?: string) => {
    if (!userId) return "System";
    const user = users.find((u) => u.id === userId);
    return user?.fullName ?? "Unknown";
  };

  // Sort entries most recent first
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries]
  );

  // Unique users for filter
  const uniqueUsers = useMemo(() => {
    const userIds = new Set(entries.map((e) => e.userId).filter(Boolean));
    return Array.from(userIds).map((id) => ({
      id: id!,
      name: getUserName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, users]);

  // Unique entity types for filter
  const uniqueEntityTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.entityType));
    return Array.from(types).sort();
  }, [entries]);

  // Unique actions for filter
  const uniqueActions = useMemo(() => {
    const actions = new Set(entries.map((e) => e.action));
    return Array.from(actions).sort();
  }, [entries]);

  // Apply filters
  const filtered = useMemo(() => {
    return sortedEntries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (entityTypeFilter !== "all" && e.entityType !== entityTypeFilter) return false;
      if (userFilter !== "all" && e.userId !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const entityName = (e.entityName ?? e.entityId).toLowerCase();
        const userName = getUserName(e.userId).toLowerCase();
        if (!entityName.includes(q) && !userName.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEntries, actionFilter, entityTypeFilter, userFilter, search]);

  // Summary stats
  const stats = useMemo(() => {
    const created = filtered.filter((e) => e.action === "created").length;
    const updated = filtered.filter((e) => e.action === "updated").length;
    const deleted = filtered.filter((e) => e.action === "deleted").length;
    const activeUsers = new Set(filtered.map((e) => e.userId).filter(Boolean)).size;
    return { total: filtered.length, created, updated, deleted, activeUsers };
  }, [filtered]);

  const columns = useMemo<ColumnDef<ActivityLogEntry>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
        cell: ({ row }) => {
          try {
            return format(new Date(row.getValue("createdAt")), "MM/dd/yyyy h:mm a");
          } catch {
            return row.getValue("createdAt");
          }
        },
        sortingFn: "datetime",
      },
      {
        id: "user",
        accessorFn: (row) => getUserName(row.userId),
        header: ({ column }) => <SortableHeader column={column}>User</SortableHeader>,
      },
      {
        accessorKey: "action",
        header: ({ column }) => <SortableHeader column={column}>Action</SortableHeader>,
        cell: ({ row }) => {
          const action = row.getValue("action") as ActivityAction;
          const Icon = ACTION_ICONS[action] ?? Activity;
          return (
            <Badge variant={ACTION_VARIANT[action] ?? "outline"} className="gap-1">
              <Icon className="h-3 w-3" />
              {ACTION_LABELS[action] ?? action}
            </Badge>
          );
        },
      },
      {
        accessorKey: "entityType",
        header: ({ column }) => <SortableHeader column={column}>Entity Type</SortableHeader>,
        cell: ({ row }) => {
          const type = row.getValue("entityType") as ActivityEntityType;
          return ENTITY_LABELS[type] ?? type;
        },
      },
      {
        id: "entity",
        accessorFn: (row) => row.entityName ?? row.entityId,
        header: ({ column }) => <SortableHeader column={column}>Entity</SortableHeader>,
        cell: ({ row }) => {
          const entry = row.original;
          const name = entry.entityName ?? entry.entityId;
          const route = ENTITY_ROUTES[entry.entityType];
          if (route) {
            return (
              <Link
                href={`${route}/${entry.entityId}`}
                className="font-medium text-primary hover:underline"
              >
                {name}
              </Link>
            );
          }
          return <span>{name}</span>;
        },
      },
      {
        id: "changes",
        accessorFn: (row) => {
          if (!row.changes) return "";
          return Object.entries(row.changes)
            .map(([field, val]) => `${field}: ${val.old} → ${val.new}`)
            .join("; ");
        },
        header: "Changes",
        cell: ({ row }) => {
          const changes = row.original.changes;
          if (!changes) return <span className="text-muted-foreground">—</span>;
          const entries = Object.entries(changes);
          return (
            <div className="flex flex-col gap-1">
              {entries.map(([field, val]) => (
                <span key={field} className="text-xs text-muted-foreground truncate max-w-[200px] block" title={`${field}: ${val.old} → ${val.new}`}>
                  {field}: {val.old} → {val.new}
                </span>
              ))}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users]
  );

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity Log" />
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        subtitle="View all activity across your organization"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.created}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.updated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by entity or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((a) => (
                  <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Entity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                {uniqueEntityTypes.map((t) => (
                  <SelectItem key={t} value={t}>{ENTITY_LABELS[t] ?? t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filtered}
            showColumnVisibility={false}
            emptyMessage="No activity log entries found."
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
