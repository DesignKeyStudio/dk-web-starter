"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_GRADIENT } from "@/lib/brand";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("This reset link has expired or is invalid. Please request a new one.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 2000);
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
            {success ? "Password updated" : "Set new password"}
          </p>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Your password has been updated. Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full text-white" style={{ background: BRAND_GRADIENT }} disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center pt-0">
          {success ? (
            <Link href="/login" className="text-sm text-primary hover:text-primary/80 hover:underline">Sign In</Link>
          ) : (
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">Request a new link</Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
