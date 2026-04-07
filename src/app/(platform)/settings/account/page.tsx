"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateUserProfile, insertActivityLog } from "@/lib/actions/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/custom/page-header";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";

const accountSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  theme: z.enum(["light", "dark"]),
  homePage: z.string().min(1, "Home page is required"),
});

type AccountFormData = z.infer<typeof accountSchema>;

const homePageOptions = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/notifications", label: "Notifications" },
];

export default function AccountPage() {
  const currentUser = useAuthStore((s) => s.getCurrentUser());
  const org = useAuthStore((s) => s.getActiveOrg());
  const getUserRoles = useAuthStore((s) => s.getUserRoles);
  const userRoles = useMemo(() => getUserRoles(), [getUserRoles]);
  const roles = useAuthStore((s) => s.roles);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const { theme: currentTheme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: "", email: "", theme: "light", homePage: "/dashboard" },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        fullName: currentUser.fullName,
        email: currentUser.email,
        theme: currentUser.theme,
        homePage: currentUser.homePage,
      });
    }
  }, [currentUser, form]);

  if (!currentUser) return null;

  const initials = getInitials(currentUser.fullName);
  const userRole = userRoles[0];
  const role = userRole ? roles.find((r) => r.id === userRole.roleId) : null;

  const onSubmit = async (data: AccountFormData) => {
    if (!currentUser || !org) return;
    setSaving(true);
    try {
      await updateUserProfile(currentUser.id, {
        fullName: data.fullName,
        email: data.email,
        theme: data.theme,
        homePage: data.homePage,
      });
      await insertActivityLog({
        organizationId: org.id,
        userId: currentUser.id,
        action: "updated",
        entityType: "user",
        entityId: currentUser.id,
        entityName: data.fullName,
      });
      updateUser(currentUser.id, {
        fullName: data.fullName,
        email: data.email,
        theme: data.theme,
        homePage: data.homePage,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
      // Apply theme
      if (data.theme !== currentUser.theme) {
        setTheme(data.theme);
      }
      toast.success("Account updated successfully");
      setEditing(false);
    } catch {
      toast.error("Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = async (checked: boolean) => {
    if (!currentUser || !org) return;
    const newTheme = checked ? "dark" : "light";
    setThemeSaving(true);
    setTheme(newTheme);
    try {
      await updateUserProfile(currentUser.id, { theme: newTheme });
      updateUser(currentUser.id, { theme: newTheme });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersWithOrgs });
    } catch {
      // Revert on failure
      setTheme(currentUser.theme);
      toast.error("Failed to update theme");
    } finally {
      setThemeSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Account"
        subtitle="Manage your profile and preferences"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{currentUser.fullName}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {currentUser.isSuperAdmin && <Badge variant="destructive">Super Admin</Badge>}
                {role && <Badge variant="outline">{role.name}</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!editing ? (
            <div className="space-y-3">
              <DetailRow label="Name" value={currentUser.fullName} />
              <DetailRow label="Email" value={currentUser.email} />
              <DetailRow label="Role" value={role?.name ?? (currentUser.isSuperAdmin ? "Super Admin" : "—")} />
              <DetailRow label="Theme" value={currentUser.theme === "light" ? "Light" : "Dark"} />
              <DetailRow label="Home Page" value={homePageOptions.find(o => o.value === currentUser.homePage)?.label ?? currentUser.homePage} />
              <Button className="mt-4" onClick={() => setEditing(true)}>Edit Profile</Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="theme" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="homePage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Page</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {homePageOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="theme-toggle"
              checked={currentTheme === "dark"}
              onCheckedChange={handleThemeToggle}
              disabled={themeSaving}
            />
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
