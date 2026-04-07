"use client";

import { PageHeader } from "@/components/custom/page-header";
import { KpiCard } from "@/components/custom/kpi-card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Users, Shield, Building2, Activity } from "lucide-react";

export default function DashboardPage() {
  const users = useAuthStore((s) => s.users);
  const roles = useAuthStore((s) => s.roles);
  const organizations = useAuthStore((s) => s.organizations);

  const activeUsers = users.filter((u) => u.isActive).length;
  const activeRoles = roles.filter((r) => r.isActive).length;
  const orgName = organizations[0]?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to your workspace"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Users"
          value={String(activeUsers)}
          icon={Users}
          subtitle="Team members with access"
        />
        <KpiCard
          label="Roles Configured"
          value={String(activeRoles)}
          icon={Shield}
          subtitle="Permission roles in org"
        />
        <KpiCard
          label="Organization"
          value={orgName}
          icon={Building2}
          subtitle="Your current workspace"
        />
        <KpiCard
          label="Recent Activity"
          value="—"
          icon={Activity}
          subtitle="Check Activity Log in Settings"
        />
      </div>

      {/* TODO: Add your domain widgets, charts, and KPIs here */}
    </div>
  );
}
