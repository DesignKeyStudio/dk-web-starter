import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeaderUserMenu } from "@/components/layout/header-user-menu";
import { Bell, Moon } from "lucide-react";

/**
 * AppHeader depends on useAppHeader hook (auth store, theme, notifications).
 * This story renders a static replica to showcase the layout and visual variants.
 */
function HeaderPreview({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <div className="flex-1" />
      <Button variant="ghost" size="icon" title="Switch to dark mode">
        <Moon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]">
            {unreadCount}
          </Badge>
        )}
      </Button>
      <HeaderUserMenu
        displayName="Sarah Mitchell"
        displayEmail="sarah@company.com"
        avatarInitials="SM"
        onSignOut={() => console.log("Sign out")}
      />
    </header>
  );
}

const meta: Meta = {
  title: "Layout/AppHeader",
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <HeaderPreview />,
};

export const WithNotifications: Story = {
  render: () => <HeaderPreview unreadCount={5} />,
};

export const ManyNotifications: Story = {
  render: () => <HeaderPreview unreadCount={99} />,
};
