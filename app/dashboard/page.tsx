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
  Bell,
  BarChart3,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getDashboardStats,
  getSubscriptionsWithCount,
  getCategoryCounts,
} from "@/lib/data/dashboard";
import { getOrgContext } from "@/lib/permissions.server";
import { getOrgAccess } from "@/lib/permissions";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SubscriptionTable } from "@/components/dashboard/subscription-table";
import { PreviewBanner, HiddenCountBanner } from "@/components/dashboard/preview-banner";
import { LockedSection } from "@/components/ui/locked-section";

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

  // Fetch org context for access check
  const orgContext = await getOrgContext(orgId);
  const access = orgContext ? getOrgAccess(orgContext) : null;

  // Determine subscription limit based on access
  const subscriptionLimit = access?.limits.maxVisibleSubscriptions ?? null;

  // Fetch data in parallel
  const [stats, subscriptionsData, categoryCounts] = await Promise.all([
    getDashboardStats(orgId),
    getSubscriptionsWithCount(orgId, subscriptionLimit),
    getCategoryCounts(orgId),
  ]);

  const { subscriptions, totalCount } = subscriptionsData;
  const hiddenCount = totalCount - subscriptions.length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Preview Banner */}
      {access?.isPreview && totalCount > 0 && (
        <PreviewBanner
          totalSubscriptions={totalCount}
          visibleSubscriptions={subscriptions.length}
          daysRemaining={access.daysRemaining}
        />
      )}

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
          value={totalCount.toString()}
          icon={CreditCard}
          description="Currently tracked"
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

      {/* Category Overview - Show counts only for preview */}
      {Object.keys(categoryCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="px-3 py-1.5 bg-secondary rounded-full text-sm"
                  >
                    {category}: <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-display text-xl">Subscriptions</CardTitle>
          {!access?.isPreview && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/subscriptions">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <SubscriptionTable subscriptions={subscriptions} />

          {/* Hidden count banner for preview users */}
          {access?.isPreview && hiddenCount > 0 && (
            <HiddenCountBanner hiddenCount={hiddenCount} />
          )}
        </CardContent>
      </Card>

      {/* Locked Sections for Preview Users */}
      {access?.isPreview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LockedSection
            title="Renewal Tracking"
            description="Never miss a renewal date. Get a complete calendar view of upcoming charges and manage your subscription lifecycle."
            ctaText="Upgrade to Track Renewals"
          >
            {/* Preview content hint */}
            <div className="p-6 space-y-4">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
          </LockedSection>

          <LockedSection
            title="Smart Alerts"
            description="Get notified before you're charged. Set up alerts for renewals, price changes, and unused subscriptions."
            ctaText="Upgrade for Alerts"
          >
            {/* Preview content hint */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground/30" />
                <div className="h-4 bg-secondary rounded flex-1" />
              </div>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground/30" />
                <div className="h-4 bg-secondary rounded flex-1" />
              </div>
            </div>
          </LockedSection>
        </div>
      )}
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
