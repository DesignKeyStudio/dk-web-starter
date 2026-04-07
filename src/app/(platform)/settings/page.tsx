"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/custom/page-header";
import {
  Users,
  Shield,
  Building2,
  Layers,
  Activity,
  Receipt,
  UserCircle,
  Puzzle,
  ChevronRight,
} from "lucide-react";

const settingsCards: {
  title: string;
  description: string;
  href: string;
  icon: typeof UserCircle;
  permGroup?: string;
  permAction?: string;
}[] = [
  { title: "Account", description: "Manage your profile and preferences", href: "/settings/account", icon: UserCircle },
  { title: "Organization", description: "Manage your organization settings", href: "/settings/organization", icon: Building2 },
  { title: "Users", description: "Manage team members and their access", href: "/settings/users", icon: Users, permGroup: "Settings", permAction: "Edit Settings" },
  { title: "Roles & Permissions", description: "Define roles and control access permissions", href: "/settings/roles", icon: Shield, permGroup: "Settings", permAction: "Edit Settings" },
  { title: "Departments", description: "Organize your team by department", href: "/settings/departments", icon: Layers, permGroup: "Settings", permAction: "Edit Settings" },
  { title: "Activity Log", description: "View all activity across your organization", href: "/settings/activity-log", icon: Activity, permGroup: "Settings", permAction: "Edit Settings" },
  { title: "Billing", description: "View your plan and billing details", href: "/settings/billing", icon: Receipt, permGroup: "Settings", permAction: "Edit Settings" },
  { title: "Integrations", description: "Connect third-party services and tools", href: "/settings/integrations", icon: Puzzle, permGroup: "Settings", permAction: "Edit Settings" },
];

export default function SettingsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleCards = settingsCards.filter(
    (card) => !card.permGroup || !card.permAction || hasPermission(card.permGroup, card.permAction)
  );

  if (visibleCards.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No settings available for your role. Contact your admin if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your organization's settings and preferences"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="group cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
