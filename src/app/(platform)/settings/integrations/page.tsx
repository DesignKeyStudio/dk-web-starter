"use client";

import { PageHeader } from "@/components/custom/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Puzzle } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        subtitle="Connect third-party services and APIs"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Puzzle className="size-5 text-muted-foreground" />
            <CardTitle>Third-Party Integrations</CardTitle>
          </div>
          <CardDescription>
            Connect your app to external services like Slack, Zapier, webhooks, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {/* TODO: Add your integrations here */}
            No integrations configured yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
