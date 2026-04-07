"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Building2, ChevronDown, PanelLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SIDEBAR_NAV_ITEMS } from "@/lib/sidebar-nav";

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const users = useAuthStore((s) => s.users);
  const organizations = useAuthStore((s) => s.organizations);
  const currentUser = currentUserId ? users.find((u) => u.id === currentUserId) ?? null : null;
  const org = currentUser ? organizations.find((o) => o.id === currentUser.organizationId) : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={collapsed ? "px-0 py-4" : "px-4 py-4 space-y-3"}>
        {collapsed ? (
          <div className="flex items-center justify-center">
            <button onClick={toggleSidebar} className="rounded-xl p-3 text-[#bababa] hover:text-white hover:bg-white/5 transition-colors" title="Expand sidebar">
              <PanelLeft className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pl-3 pr-1">
            <Link href="/dashboard" className="flex items-center gap-1">
              {/* TODO: Replace with your logo — <Image src="/logo.png" alt="App" width={26} height={26} /> */}
              <span className="text-base font-semibold text-white">__PROJECT_NAME__</span>
            </Link>
            <button onClick={toggleSidebar} className="shrink-0 rounded-xl p-3 text-[#bababa] hover:text-white hover:bg-white/5 transition-colors" title="Collapse sidebar">
              <PanelLeft className="h-5 w-5" />
            </button>
          </div>
        )}

        {org && collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mx-auto flex items-center justify-center rounded-lg border border-sidebar-border p-3 text-[#bababa]">
                <Building2 className="h-5 w-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{org.name}</TooltipContent>
          </Tooltip>
        )}
        {org && !collapsed && (
          <div className="flex w-full items-center gap-1.5 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-medium text-white">
            <Building2 className="h-5 w-5 shrink-0 opacity-70" />
            <span className="truncate flex-1 text-left">{org.name}</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className={collapsed ? "px-0 pt-3 items-center" : "px-4 pt-3"}>
          <SidebarGroupContent>
            <SidebarMenu className={`gap-2.5 ${collapsed ? "items-center" : ""}`}>
              {SIDEBAR_NAV_ITEMS.map((item) => {
                if (item.superAdminOnly && !currentUser?.isSuperAdmin) return null;
                if (item.hiddenForSuperAdmin && currentUser?.isSuperAdmin) return null;
                if (item.permGroup && item.permAction && !hasPermission(item.permGroup, item.permAction)) return null;

                // For items with children, hide the parent if all children are filtered by permissions
                if (item.children) {
                  const hasVisibleChild = item.children.some(
                    (child) => !child.permGroup || !child.permAction || hasPermission(child.permGroup, child.permAction)
                  );
                  if (!hasVisibleChild) return null;
                }

                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                if (collapsed) {
                  return (
                    <SidebarMenuItem key={item.href} className="flex justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={item.href} className={`flex items-center justify-center rounded-lg p-2 transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                            <Icon className="h-5 w-5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                if (item.children) {
                  return (
                    <Collapsible key={item.href} defaultOpen={isActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={isActive} className="h-9 rounded-lg">
                            <Icon className="h-5 w-5" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => {
                              if (child.permGroup && child.permAction && !hasPermission(child.permGroup, child.permAction)) return null;
                              return (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                                    <Link href={child.href}>{child.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} className="h-9 rounded-lg">
                      <Link href={item.href}>
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
