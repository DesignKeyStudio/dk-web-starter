"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_GRADIENT } from "@/lib/brand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    // Always show success (prevents email enumeration)
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 dark:bg-background">
      <div
        className="pointer-events-none fixed inset-0 opacity-30 dark:opacity-10"
        style={{ background: "radial-gradient(ellipse at 30% 20%, #3A58BE22 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #502A9922 0%, transparent 50%)" }}
      />

      <Card className="relative z-10 w-full max-w-md border shadow-lg dark:border-border">
        <CardHeader className="items-center space-y-4 pb-2">
          <Image src="/SubscriptionCentralLogo2.png" alt="SubscriptionCentral" width={280} height={56} className="h-12 w-auto dark:brightness-110 dark:contrast-125" priority />
          <p className="text-sm text-muted-foreground">
            {sent ? "Check your email" : "Reset your password"}
          </p>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. The link will expire in 60 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full text-white"
                style={{ background: BRAND_GRADIENT }}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center pt-0">
          <Link href="/login" className="text-sm text-primary hover:text-primary/80 hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
