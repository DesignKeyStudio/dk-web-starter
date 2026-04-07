import type { ElementType } from "react";
import {
  LayoutDashboard,
  Settings,
  Bell,
} from "lucide-react";

export type SidebarNavChild = {
  title: string;
  href: string;
  permGroup?: string;
  permAction?: string;
};

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: ElementType;
  permGroup?: string;
  permAction?: string;
  superAdminOnly?: boolean;
  hiddenForSuperAdmin?: boolean;
  children?: SidebarNavChild[];
};

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permGroup: "Dashboard",
    permAction: "View",
  },
  // TODO: Add your domain nav items here
  // {
  //   title: "Subscriptions",
  //   href: "/subscriptions",
  //   icon: CreditCard,
  //   permGroup: "Subscriptions",
  //   permAction: "View",
  // },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      { title: "Account", href: "/settings/account" },
      { title: "Organization", href: "/settings/organization" },
      { title: "Users", href: "/settings/users", permGroup: "Settings", permAction: "Edit Settings" },
      { title: "Roles", href: "/settings/roles", permGroup: "Settings", permAction: "Edit Settings" },
      { title: "Departments", href: "/settings/departments", permGroup: "Settings", permAction: "Edit Settings" },
      { title: "Activity Log", href: "/settings/activity-log", permGroup: "Settings", permAction: "Edit Settings" },
      { title: "Billing", href: "/settings/billing", permGroup: "Settings", permAction: "Edit Settings" },
      { title: "Integrations", href: "/settings/integrations", permGroup: "Settings", permAction: "Edit Settings" },
    ],
  },
];
