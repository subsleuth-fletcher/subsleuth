"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronRight, FileSpreadsheet, Database, PenLine } from "lucide-react";
import type { SubscriptionWithSource } from "@/lib/data/dashboard";

type SubscriptionStatus = "active" | "trial" | "cancelled";
type DetectedSource = "csv_import" | "quickbooks" | "xero" | "manual";

const statusConfig: Record<
  SubscriptionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  trial: { label: "Trial", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const sourceConfig: Record<DetectedSource, { label: string; icon: typeof FileSpreadsheet }> = {
  csv_import: { label: "CSV Import", icon: FileSpreadsheet },
  quickbooks: { label: "QuickBooks", icon: Database },
  xero: { label: "Xero", icon: Database },
  manual: { label: "Manual", icon: PenLine },
};

export function SubscriptionTable({
  subscriptions,
}: {
  subscriptions: SubscriptionWithSource[];
}) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No subscriptions found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add a subscription or import from CSV to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Monthly Cost</TableHead>
            <TableHead>Renewal Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <SubscriptionRow key={subscription.id} subscription={subscription} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SubscriptionRow({
  subscription,
}: {
  subscription: SubscriptionWithSource;
}) {
  const status = statusConfig[subscription.status];
  const source = sourceConfig[subscription.detectedSource];
  const SourceIcon = source.icon;

  return (
    <TableRow className="cursor-pointer hover:bg-secondary/50">
      <TableCell className="font-medium">{subscription.vendorName}</TableCell>
      <TableCell className="text-muted-foreground">
        {subscription.category || "—"}
      </TableCell>
      <TableCell>{formatCurrency(subscription.monthlyCost)}</TableCell>
      <TableCell className="text-muted-foreground">
        {subscription.renewalDate ? formatDate(subscription.renewalDate) : "—"}
      </TableCell>
      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <SourceIcon className="w-4 h-4" />
          <span className="text-sm">{source.label}</span>
        </div>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/subscriptions/${subscription.id}`}>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
