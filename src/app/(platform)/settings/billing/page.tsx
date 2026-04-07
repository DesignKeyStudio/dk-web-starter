"use client";

import { PageHeader } from "@/components/custom/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription and payment details"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" />
            <CardTitle>Billing & Payments</CardTitle>
          </div>
          <CardDescription>
            Connect your billing provider (Stripe, Paddle, etc.) to manage subscriptions and payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {/* TODO: Integrate your billing provider here */}
            Billing integration coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
