"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateOrganization as updateOrgAction, insertActivityLog } from "@/lib/actions/mutations";
import { useDepartmentsQuery } from "@/lib/queries/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/custom/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

type OrgFormData = z.infer<typeof orgSchema>;

export default function OrganizationPage() {
  const org = useAuthStore((s) => s.getActiveOrg());
  const currentUser = useAuthStore((s) => s.getCurrentUser());
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const users = useAuthStore((s) => s.users);
  const queryClient = useQueryClient();

  const { data: departments, isLoading: statsLoading } = useDepartmentsQuery();

  const deptList = departments ?? [];

  const canEdit = hasPermission("Settings", "Edit Settings");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (org) {
      form.reset({ name: org.name, slug: org.slug });
    }
  }, [org, form]);

  if (!org) {
    return <div className="p-6 text-muted-foreground">No organization found.</div>;
  }

  const stats = [
    { label: "Users", value: users.length.toString() },
    { label: "Departments", value: deptList.length.toString() },
  ];

  const onSubmit = async (data: OrgFormData) => {
    if (!currentUser || !org) return;
    setSaving(true);
    try {
      await updateOrgAction(org.id, { name: data.name, slug: data.slug });
      await insertActivityLog({
        organizationId: org.id,
        userId: currentUser.id,
        action: "updated",
        entityType: "organization",
        entityId: org.id,
        entityName: data.name,
      });
      updateOrganization(org.id, { name: data.name, slug: data.slug });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
      toast.success(`Organization updated to "${data.name}"`);
      setEditing(false);
    } catch {
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        subtitle="Manage your organization settings"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{org.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{org.slug}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing && canEdit ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Organization Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-3">
              <DetailRow label="Name" value={org.name} />
              <DetailRow label="Slug" value={org.slug} />
              <DetailRow label="Plan" value={org.plan === "paid" ? "Paid" : "Free"} />
              <DetailRow label="Status" value={org.isActive ? "Active" : "Inactive"} />
              {canEdit && (
                <Button className="mt-4" onClick={() => setEditing(true)}>Edit Organization</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Organization Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {statsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              : stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
