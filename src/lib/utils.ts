import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date string (YYYY-MM-DD or ISO) to MM/DD/YYYY */
export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const parts = value.split("T")[0].split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${m}/${d}/${y}`;
  }
  return value;
}

/** Part of email before @ (for compact display). */
export function emailLocalPart(email: string): string {
  const i = email.indexOf("@");
  return i === -1 ? email : email.slice(0, i);
}

/** Extract initials from fullName, fallback to email first char */
export function getInitials(fullName?: string | null, email?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

/** Generate URL-friendly slug from text */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
