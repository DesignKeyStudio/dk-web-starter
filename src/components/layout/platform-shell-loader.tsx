"use client";

import Image from "next/image";

/** Full-screen loader; uses the same theme tokens as the app (`bg-background`, `dark:` on `html`). */
export function PlatformShellLoader() {
  return (
    <div
      className="relative flex min-h-svh w-full flex-col items-center justify-center gap-8 bg-background text-foreground"
      role="status"
      aria-busy="true"
      aria-label="Loading application"
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-30 dark:opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, #3A58BE22 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #502A9922 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <Image
          src="/SubscriptionCentralLogo2.png"
          alt="SubscriptionCentral"
          width={240}
          height={48}
          className="h-11 w-auto dark:brightness-110 dark:contrast-125"
          priority
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 rounded-full border-2 border-muted border-t-primary border-r-secondary animate-spin"
            style={{ animationDuration: "0.85s" }}
            aria-hidden
          />
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        </div>
      </div>
    </div>
  );
}
