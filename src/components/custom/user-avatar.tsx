"use client";

import { BRAND_GRADIENT } from "@/lib/brand";

interface UserAvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function UserAvatar({ initials, size = "md" }: UserAvatarProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ${sizeClasses[size]}`}
      style={{ background: BRAND_GRADIENT }}
    >
      {initials}
    </div>
  );
}
