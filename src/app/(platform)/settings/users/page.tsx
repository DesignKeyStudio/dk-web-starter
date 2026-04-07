"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  updateUserProfile as updateUserProfileAction,
  assignUserRole as assignUserRoleAction,
  removeUserRole as removeUserRoleAction,
  deactivateUser as deactivateUserAction,
  inviteUser as inviteUserAction,
  insertActivityLog,
} from "@/lib/actions/mutations";
import { useUsersSettingsDataQuery } from "@/lib/queries/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { DataTable, SortableHeader } from "@/components/data-table";
import { PageHeader } from "@/components/custom/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import type { User, UserRole } from "@/types";

const userFormSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  roleId: z.string().min(1, "Role is required"),
  departmentIds: z.array(z.string()),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UsersSettingsPage() {
  const currentUser = useAuthStore((s) => s.getCurrentUser());
  const org = useAuthStore((s) => s.getActiveOrg());
  const hasPermission = useAuthStore((s) => s.hasPermission);

  // Real mode
  const { data: pageData, isLoading } = useUsersSettingsDataQuery();
  const queryClient = useQueryClient();

  const orgId = org?.id;
  const users = (pageData?.users ?? []).filter((u) => u.organizationId === orgId);
  const roles = pageData?.roles ?? [];
  const userRoles = pageData?.userRoles ?? [];
  const departments = pageData?.departments ?? [];
  const activeRoles = roles.filter((r) => r.isActive);
  const canEdit = hasPermission("Settings", "Edit Settings");

  const [editUser, setEditUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deactivateItem, setDeactivateItem] = useState<User | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);
  const [bulkDeactivating, setBulkDeactivating] = useState(false);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { fullName: "", email: "", roleId: "", departmentIds: [], isActive: true },
  });

  const getUserRole = (userId: string): UserRole | undefined =>
    userRoles.find((ur) => ur.userId === userId);

  const getRoleName = (userId: string): string => {
    const ur = getUserRole(userId);
    if (!ur) return "—";
    const role = roles.find((r) => r.id === ur.roleId);
    return role?.name ?? "—";
  };

  const getUserDepts = (userId: string): string => {
    const ur = getUserRole(userId);
    if (!ur || ur.departmentIds.length === 0) return "All";
    return ur.departmentIds
      .map((did) => departments.find((d) => d.id === did)?.name ?? did)
      .join(", ");
  };

  const openCreate = () => {
    setEditUser(null);
    form.reset({ fullName: "", email: "", roleId: "", departmentIds: [], isActive: true });
    setSheetOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    const ur = getUserRole(user.id);
    form.reset({
      fullName: user.fullName,
      email: user.email,
      roleId: ur?.roleId ?? "",
      departmentIds: ur?.departmentIds ?? [],
      isActive: user.isActive,
    });
    setSheetOpen(true);
  };

  const onSubmit = async (data: UserFormData) => {
    if (!currentUser || !org) return;
    setSaving(true);
    try {
      if (editUser) {
        await updateUserProfileAction(editUser.id, { fullName: data.fullName, email: data.email });
        const existingUr = getUserRole(editUser.id);
        if (existingUr) await removeUserRoleAction(existingUr.id);
        await assignUserRoleAction({ userId: editUser.id, roleId: data.roleId, departmentIds: data.departmentIds });
        await insertActivityLog({
          organizationId: org.id, userId: currentUser.id,
          action: "updated", entityType: "user",
          entityId: editUser.id, entityName: data.fullName,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
        toast.success("User updated");
      } else {
        await inviteUserAction({
          fullName: data.fullName,
          email: data.email,
          roleId: data.roleId,
          departmentIds: data.departmentIds,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
        toast.success(`Invitation sent to ${data.email}`);
      }
      setSheetOpen(false);
    } catch {
      toast.error(editUser ? "Failed to update user" : "Failed to invite user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateItem || !currentUser || !org) return;
    setDeactivating(true);
    try {
      await deactivateUserAction(deactivateItem.id);
      await insertActivityLog({
        organizationId: org.id, userId: currentUser.id,
        action: "updated", entityType: "user",
        entityId: deactivateItem.id, entityName: deactivateItem.fullName,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
      toast.success("User deactivated");
      setDeactivateItem(null);
    } catch {
      toast.error("Failed to deactivate user");
    } finally {
      setDeactivating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!currentUser || !org || selectedIds.length === 0) return;
    setBulkDeactivating(true);
    try {
      for (const id of selectedIds) {
        const user = users.find((u) => u.id === id);
        await deactivateUserAction(id);
        await insertActivityLog({
          organizationId: org.id, userId: currentUser.id,
          action: "updated", entityType: "user",
          entityId: id, entityName: user?.fullName,
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
      toast.success(`${selectedIds.length} ${selectedIds.length === 1 ? 'user' : 'users'} deactivated`);
      setRowSelection({});
      setBulkDeactivateOpen(false);
    } catch {
      toast.error("Failed to deactivate users");
    } finally {
      setBulkDeactivating(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Role", "Departments", "Active"];
    const rows = users.map((u) => [
      u.fullName, u.email, getRoleName(u.id), getUserDepts(u.id), u.isActive ? "Yes" : "No",
    ]);
    const csv = headers.join(",") + "\n" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "fullName",
        header: ({ column }) => <SortableHeader column={column}>User</SortableHeader>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <button
              type="button"
              onClick={() => canEdit && openEdit(user)}
              className="flex items-center gap-2 hover:underline text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {getInitials(user.fullName)}
              </div>
              <div>
                <span className="font-medium">{user.fullName}</span>
                {user.isSuperAdmin && (
                  <Badge variant="outline" className="ml-2 text-[10px]">Super Admin</Badge>
                )}
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      },
      {
        id: "role",
        accessorFn: (row) => getRoleName(row.id),
        header: ({ column }) => <SortableHeader column={column}>Role</SortableHeader>,
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue("role")}</Badge>
        ),
      },
      {
        id: "departments",
        accessorFn: (row) => getUserDepts(row.id),
        header: "Departments",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{row.getValue("departments")}</span>
        ),
      },
      {
        id: "status",
        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.getValue("status")}
          </Badge>
        ),
      },
      ...(canEdit
        ? [{
            id: "actions",
            cell: ({ row }: { row: { original: User } }) => (
              row.original.isActive && !row.original.isSuperAdmin ? (
                <Button variant="ghost" size="icon" onClick={() => setDeactivateItem(row.original)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              ) : null
            ),
            enableSorting: false,
            size: 50,
          } as ColumnDef<User>]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles, userRoles, departments, canEdit]
  );

  if (isLoading || !orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" subtitle="Loading users..." />
        <Card>
          <CardContent className="pt-6 space-y-3">
            {/* Search bar skeleton */}
            <Skeleton className="h-9 w-64" />
            {/* Table header */}
            <div className="flex items-center gap-4 border-b pb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" />
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle={`${users.length} ${users.length === 1 ? "user" : "users"} in your organization`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={openCreate}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite User
            </Button>
          </div>
        }
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>Clear</Button>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeactivateOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Deactivate Selected
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={users}
            showPagination={users.length > 10}
            showColumnVisibility={false}
            emptyMessage="No users found."
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editUser ? "Edit User" : "Invite User"}</SheetTitle>
            <SheetDescription>
              {editUser
                ? "Update user details and role assignment."
                : "Send an email invitation to join your organization."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="roleId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="departmentIds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Scope</FormLabel>
                  <p className="text-xs text-muted-foreground">Leave empty for access to all departments.</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {departments.filter((d) => d.isActive).map((dept) => (
                      <label key={dept.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            if (checked) field.onChange([...field.value, dept.id]);
                            else field.onChange(field.value.filter((id: string) => id !== dept.id));
                          }}
                        />
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Active</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </form>
          </Form>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
              {saving
                ? (editUser ? "Saving..." : "Sending Invite...")
                : editUser
                  ? "Save Changes"
                  : "Send Invite"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Deactivate Confirmation */}
      <Dialog open={!!deactivateItem} onOpenChange={() => setDeactivateItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate &ldquo;{deactivateItem?.fullName}&rdquo;? They will lose access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateItem(null)} disabled={deactivating}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Deactivate Confirmation */}
      <Dialog open={bulkDeactivateOpen} onOpenChange={setBulkDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {selectedIds.length} {selectedIds.length === 1 ? 'User' : 'Users'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedIds.length} {selectedIds.length === 1 ? 'user' : 'users'}? They will lose access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeactivateOpen(false)} disabled={bulkDeactivating}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDeactivate} disabled={bulkDeactivating}>
              {bulkDeactivating ? "Deactivating..." : "Deactivate All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
