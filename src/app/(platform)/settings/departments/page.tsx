"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  createDepartment as createDepartmentAction,
  updateDepartment as updateDepartmentAction,
  deleteDepartment as deleteDepartmentAction,
  bulkDeleteDepartments as bulkDeleteDepartmentsAction,
  insertActivityLog,
} from "@/lib/actions/mutations";
import { useDepartmentsQuery } from "@/lib/queries/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Download, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { parseCSVLine } from "@/lib/csv-utils";
import type { Department } from "@/types";

const deptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean(),
});

type DeptFormData = z.infer<typeof deptSchema>;

export default function DepartmentsPage() {
  const currentUser = useAuthStore((s) => s.getCurrentUser());
  const org = useAuthStore((s) => s.getActiveOrg());
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const { data: realDepartments, isLoading } = useDepartmentsQuery();
  const queryClient = useQueryClient();

  const departments = realDepartments ?? [];
  const canEdit = hasPermission("Settings", "Edit Settings");

  const [editItem, setEditItem] = useState<Department | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Department | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  const form = useForm<DeptFormData>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", isActive: true },
  });

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: "", isActive: true });
    setSheetOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditItem(dept);
    form.reset({ name: dept.name, isActive: dept.isActive });
    setSheetOpen(true);
  };

  const onSubmit = async (data: DeptFormData) => {
    if (!currentUser || !org) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateDepartmentAction(editItem.id, { name: data.name });
        await insertActivityLog({
          organizationId: org.id,
          userId: currentUser.id,
          action: "updated",
          entityType: "department",
          entityId: editItem.id,
          entityName: data.name,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.departments });
        toast.success("Department updated");
      } else {
        const newItem = await createDepartmentAction(data.name);
        await insertActivityLog({
          organizationId: org.id,
          userId: currentUser.id,
          action: "created",
          entityType: "department",
          entityId: newItem.id,
          entityName: data.name,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.departments });
        toast.success("Department created");
      }
      setSheetOpen(false);
    } catch {
      toast.error(editItem ? "Failed to update department" : "Failed to create department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !currentUser || !org) return;
    setDeleting(true);
    try {
      await deleteDepartmentAction(deleteItem.id);
      await insertActivityLog({
        organizationId: org.id,
        userId: currentUser.id,
        action: "deleted",
        entityType: "department",
        entityId: deleteItem.id,
        entityName: deleteItem.name,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      toast.success("Department deleted");
      setDeleteItem(null);
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!currentUser || !org || selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      await bulkDeleteDepartmentsAction(selectedIds);
      for (const id of selectedIds) {
        const dept = departments.find((d) => d.id === id);
        await insertActivityLog({
          organizationId: org.id,
          userId: currentUser.id,
          action: "deleted",
          entityType: "department",
          entityId: id,
          entityName: dept?.name,
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      toast.success(`${selectedIds.length} ${selectedIds.length === 1 ? 'department' : 'departments'} deleted`);
      setRowSelection({});
      setBulkDeleteOpen(false);
    } catch {
      toast.error("Failed to delete departments");
    } finally {
      setBulkDeleting(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Active"];
    const rows = departments.map((d) => [d.name, d.isActive ? "Yes" : "No"]);
    const csv = headers.join(",") + "\n" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `departments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const [importData, setImportData] = useState<{ name: string; isActive: boolean }[]>([]);
  const [, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
      const nameIdx = headers.findIndex((h) => ["name", "department", "department name"].includes(h));
      const activeIdx = headers.findIndex((h) => ["active", "status", "is active"].includes(h));
      if (nameIdx === -1) {
        toast.error("CSV must have a 'Name' column");
        return;
      }
      const parsed: { name: string; isActive: boolean }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = cols[nameIdx]?.trim();
        if (!name) continue;
        let isActive = true;
        if (activeIdx !== -1) {
          const val = cols[activeIdx]?.trim().toLowerCase();
          isActive = !["no", "false", "inactive", "0"].includes(val);
        }
        parsed.push({ name, isActive });
      }
      setImportData(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!currentUser || !org || importData.length === 0) return;
    setImporting(true);
    try {
      for (const row of importData) {
        const newItem = await createDepartmentAction(row.name);
        await insertActivityLog({
          organizationId: org.id,
          userId: currentUser.id,
          action: "created",
          entityType: "department",
          entityId: newItem.id,
          entityName: row.name,
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      toast.success(`${importData.length} ${importData.length === 1 ? 'department' : 'departments'} imported`);
      setImportOpen(false);
      setImportData([]);
      setImportFile(null);
    } catch {
      toast.error("Failed to import departments");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "Name,Active\nExample Department,Yes\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "departments-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<Department>[]>(
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
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => canEdit && openEdit(row.original)}
            className="font-medium hover:underline text-left"
          >
            {row.getValue("name")}
          </button>
        ),
      },
      {
        id: "status",
        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.getValue("status")}
          </Badge>
        ),
      },
...(canEdit
        ? [
            {
              id: "actions",
              cell: ({ row }: { row: { original: Department } }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteItem(row.original)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              ),
              enableSorting: false,
              size: 50,
            } as ColumnDef<Department>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Departments" subtitle="Organize your team by department for subscription tracking" />
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
        <PageHeader title="Departments" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Organize your team by department for subscription tracking"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setImportOpen(true); setImportData([]); setImportFile(null); }}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          </div>
        }
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>
            Clear
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={departments}
            showPagination={false}
            showColumnVisibility={false}
            emptyMessage="No departments found."
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editItem ? "Edit Department" : "Add Department"}</SheetTitle>
            <SheetDescription>
              {editItem ? "Update department details." : "Create a new department."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
              {saving ? "Saving..." : editItem ? "Save Changes" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to delete "${deleteItem?.name}"?`}
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

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.length} {selectedIds.length === 1 ? 'Department' : 'Departments'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} {selectedIds.length === 1 ? 'department' : 'departments'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Sheet */}
      <Sheet open={importOpen} onOpenChange={setImportOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Import Departments</SheetTitle>
            <SheetDescription>Upload a CSV file to import departments in bulk.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportFileChange}
            />
            {importData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{importData.length} {importData.length === 1 ? 'department' : 'departments'} found:</p>
                <div className="max-h-60 overflow-y-auto rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.isActive ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || importData.length === 0}>
              {importing ? "Importing..." : `Import ${importData.length} ${importData.length === 1 ? 'Department' : 'Departments'}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
