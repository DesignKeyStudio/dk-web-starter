"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef } from "@tanstack/react-table";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  createRole as createRoleAction,
  updateRole as updateRoleAction,
  deleteRole as deleteRoleAction,
  insertActivityLog,
} from "@/lib/actions/mutations";
import { useRolesSettingsDataQuery } from "@/lib/queries/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Role, Permission } from "@/types";

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  permissionIds: z.array(z.string()),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RolesSettingsPage() {
  const currentUser = useAuthStore((s) => s.getCurrentUser());
  const org = useAuthStore((s) => s.getActiveOrg());
  const hasPermission = useAuthStore((s) => s.hasPermission);

  // Real mode
  const { data: pageData, isLoading } = useRolesSettingsDataQuery();
  const queryClient = useQueryClient();

  const orgId = org?.id;
  const roles = (pageData?.roles ?? [])
    .filter((r) => r.organizationId === orgId);
  const permissions = pageData?.permissions ?? [];
  const canEdit = hasPermission("Settings", "Edit Settings");

  const [editRole, setEditRole] = useState<Role | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "", isActive: true, permissionIds: [] },
  });

  // Group permissions by groupName
  const permissionGroups = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.groupName]) groups[perm.groupName] = [];
      groups[perm.groupName].push(perm);
    }
    for (const group of Object.values(groups)) {
      group.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return groups;
  }, [permissions]);

  const openCreate = () => {
    setEditRole(null);
    form.reset({ name: "", description: "", isActive: true, permissionIds: [] });
    setSheetOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    form.reset({
      name: role.name,
      description: role.description ?? "",
      isActive: role.isActive,
      permissionIds: role.permissionIds,
    });
    setSheetOpen(true);
  };

  const onSubmit = async (data: RoleFormData) => {
    if (!currentUser || !org) return;
    setSaving(true);
    try {
      if (editRole) {
        await updateRoleAction(editRole.id, {
          name: data.name,
          description: data.description,
          permissionIds: data.permissionIds,
        });
        await insertActivityLog({
          organizationId: org.id, userId: currentUser.id,
          action: "updated", entityType: "role",
          entityId: editRole.id, entityName: data.name,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        toast.success("Role updated");
      } else {
        const newRole = await createRoleAction({
          name: data.name,
          description: data.description,
          permissionIds: data.permissionIds,
        });
        await insertActivityLog({
          organizationId: org.id, userId: currentUser.id,
          action: "created", entityType: "role",
          entityId: newRole.id, entityName: data.name,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        toast.success("Role created");
      }
      setSheetOpen(false);
    } catch {
      toast.error(editRole ? "Failed to update role" : "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !currentUser || !org) return;
    setDeleting(true);
    try {
      await deleteRoleAction(deleteItem.id);
      await insertActivityLog({
        organizationId: org.id, userId: currentUser.id,
        action: "deleted", entityType: "role",
        entityId: deleteItem.id, entityName: deleteItem.name,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      toast.success("Role deleted");
      setDeleteItem(null);
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue("name")}</span>
            {row.original.isSystem && (
              <Badge variant="outline" className="text-[10px]">System</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground truncate max-w-[200px] block">
            {row.getValue("description") || "—"}
          </span>
        ),
      },
      {
        id: "permissions",
        accessorFn: (row) => row.permissionIds.length,
        header: ({ column }) => <SortableHeader column={column}>Permissions</SortableHeader>,
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue("permissions")} permissions</Badge>
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
            cell: ({ row }: { row: { original: Role } }) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                {!row.original.isSystem && (
                  <Button variant="ghost" size="icon" onClick={() => setDeleteItem(row.original)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ),
            enableSorting: false,
            size: 80,
          } as ColumnDef<Role>]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit]
  );

  const isSystemRole = editRole?.isSystem ?? false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles & Permissions" subtitle="Define roles and control what each team member can access" />
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles & Permissions" />
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define roles and control what each team member can access"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={roles}
            showPagination={false}
            showColumnVisibility={false}
            emptyMessage="No roles found."
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editRole ? (isSystemRole ? `View Role: ${editRole.name}` : "Edit Role") : "Add Role"}
            </SheetTitle>
            <SheetDescription>
              {isSystemRole
                ? "System roles cannot be modified."
                : editRole
                  ? "Update role details and permissions."
                  : "Create a new role with specific permissions."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} disabled={isSystemRole} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={2} {...field} disabled={isSystemRole} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex items-center justify-between">
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSystemRole} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-medium">Permissions</h4>
                <FormField control={form.control} name="permissionIds" render={({ field }) => (
                  <FormItem>
                    {Object.entries(permissionGroups).map(([groupName, perms]) => (
                      <div key={groupName} className="space-y-2 pb-3">
                        <p className="text-sm font-medium text-muted-foreground">{groupName}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={field.value.includes(perm.id)}
                                disabled={isSystemRole}
                                onCheckedChange={(checked) => {
                                  if (checked) field.onChange([...field.value, perm.id]);
                                  else field.onChange(field.value.filter((id: string) => id !== perm.id));
                                }}
                              />
                              <span>{perm.name}</span>
                              {perm.description && (
                                <span className="text-xs text-muted-foreground">— {perm.description}</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </form>
          </Form>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
              {isSystemRole ? "Close" : "Cancel"}
            </Button>
            {!isSystemRole && (
              <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
                {saving ? "Saving..." : editRole ? "Save Changes" : "Create"}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteItem?.name}&rdquo;? Users assigned this role will lose their permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
