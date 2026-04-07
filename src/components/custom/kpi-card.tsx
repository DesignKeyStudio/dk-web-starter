"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  href?: string;
  trend?: number;
  linkLabel?: string;
  linkHref?: string;
  iconClassName?: string;
}

export function KpiCard({ label, value, subtitle, icon: Icon, href, trend, linkLabel, linkHref, iconClassName }: KpiCardProps) {
  const content = (
    <Card
      className={`gap-0 h-[86px] rounded-lg border shadow-[0px_1px_4px_rgba(43,43,43,0.05)] ${href ? "transition-colors hover:border-primary/30 hover:shadow-sm cursor-pointer" : ""}`}
    >
      <CardContent className="flex h-full items-center justify-between p-[17px]">
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground leading-[16px]">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold tracking-tight leading-[1.3]">{value}</p>
            {linkLabel && linkHref && (
              <Link
                href={linkHref}
                className="text-xs font-semibold text-foreground hover:text-foreground/80 flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {linkLabel} <span aria-hidden="true" className="text-[14px]">↗</span>
              </Link>
            )}
            {trend !== undefined && (
              <span className={`text-xs font-semibold ${trend > 0 ? "text-emerald-500" : trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                ~&gt; {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-muted-foreground leading-none">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClassName || "bg-primary/5"}`}>
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
