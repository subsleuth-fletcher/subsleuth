import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  CreditCard,
  Calendar,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardStats, getSubscriptions } from "@/lib/data/dashboard";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SubscriptionTable } from "@/components/dashboard/subscription-table";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;

  // If user has no organization, show empty state
  if (!orgId) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <h1 className="font-display text-2xl font-bold mb-2">
            No Organization Found
          </h1>
          <p className="text-muted-foreground">
            Please contact support to set up your organization.
          </p>
        </div>
      </div>
    );
  }

  // Fetch data in parallel
  const [stats, subscriptions] = await Promise.all([
    getDashboardStats(orgId),
    getSubscriptions(orgId, 10), // Limit to 10 for dashboard view
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your SaaS subscriptions
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly SaaS Spend"
          value={formatCurrency(stats.totalSpend)}
          icon={DollarSign}
          description="Total this month"
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions.toString()}
          icon={CreditCard}
          description="Currently active"
        />
        <StatsCard
          title="Upcoming Renewals"
          value={stats.upcomingRenewals.toString()}
          icon={Calendar}
          description="Next 30 days"
        />
        <StatsCard
          title="Potential Savings"
          value={formatCurrency(stats.potentialSavings)}
          icon={TrendingDown}
          description="Identified opportunities"
          highlight
        />
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-display text-xl">Subscriptions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/subscriptions">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <SubscriptionTable subscriptions={subscriptions} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  highlight = false,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        highlight && "border-primary/30 bg-gradient-to-br from-card to-primary/5"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
              className={cn(
                "font-display text-2xl font-bold mt-1",
                highlight && "text-primary"
              )}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              highlight ? "bg-primary/20" : "bg-secondary"
            )}
          >
            <Icon className={cn("w-6 h-6", highlight ? "text-primary" : "text-muted-foreground")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
