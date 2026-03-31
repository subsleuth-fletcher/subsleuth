import { getDb, subscriptions } from "@/lib/db";
import { eq, count } from "drizzle-orm";

export type DashboardStats = {
  totalSpend: number;
  activeSubscriptions: number;
  upcomingRenewals: number;
  potentialSavings: number;
};

export type SubscriptionWithSource = {
  id: string;
  vendorName: string;
  category: string | null;
  monthlyCost: number;
  renewalDate: Date | null;
  status: "active" | "cancelled" | "trial";
  detectedSource: "csv_import" | "quickbooks" | "xero" | "manual";
};

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const db = getDb();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get all subscriptions for the org
  const orgSubscriptions = await db.query.subscriptions.findMany({
    where: eq(subscriptions.orgId, orgId),
  });

  // Calculate stats
  const activeSubscriptions = orgSubscriptions.filter(
    (s) => s.status === "active" || s.status === "trial"
  );

  const totalSpend = activeSubscriptions.reduce(
    (sum, s) => sum + parseFloat(s.monthlyCost),
    0
  );

  const upcomingRenewals = activeSubscriptions.filter((s) => {
    if (!s.renewalDate) return false;
    const renewalDate = new Date(s.renewalDate);
    return renewalDate >= now && renewalDate <= thirtyDaysFromNow;
  }).length;

  // Calculate potential savings: subscriptions marked as trial or with alerts
  // For now, estimate 20% of trial subscriptions as potential savings
  const trialSubscriptions = orgSubscriptions.filter((s) => s.status === "trial");
  const potentialSavings = trialSubscriptions.reduce(
    (sum, s) => sum + parseFloat(s.monthlyCost),
    0
  );

  return {
    totalSpend: Math.round(totalSpend),
    activeSubscriptions: activeSubscriptions.length,
    upcomingRenewals,
    potentialSavings: Math.round(potentialSavings),
  };
}

export async function getSubscriptions(
  orgId: string,
  limit?: number
): Promise<SubscriptionWithSource[]> {
  const db = getDb();

  const results = await db.query.subscriptions.findMany({
    where: eq(subscriptions.orgId, orgId),
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.updatedAt)],
    limit: limit,
  });

  return results.map((s) => ({
    id: s.id,
    vendorName: s.vendorName,
    category: s.category,
    monthlyCost: parseFloat(s.monthlyCost),
    renewalDate: s.renewalDate,
    status: s.status,
    detectedSource: s.detectedSource,
  }));
}

/**
 * Get subscriptions with total count (for preview mode limiting)
 */
export async function getSubscriptionsWithCount(
  orgId: string,
  limit?: number | null
): Promise<{
  subscriptions: SubscriptionWithSource[];
  totalCount: number;
}> {
  const db = getDb();

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId));
  const totalCount = countResult[0]?.count ?? 0;

  // Get limited results
  const results = await db.query.subscriptions.findMany({
    where: eq(subscriptions.orgId, orgId),
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.updatedAt)],
    limit: limit ?? undefined,
  });

  return {
    subscriptions: results.map((s) => ({
      id: s.id,
      vendorName: s.vendorName,
      category: s.category,
      monthlyCost: parseFloat(s.monthlyCost),
      renewalDate: s.renewalDate,
      status: s.status,
      detectedSource: s.detectedSource,
    })),
    totalCount,
  };
}

/**
 * Get category counts for subscriptions
 */
export async function getCategoryCounts(
  orgId: string
): Promise<Record<string, number>> {
  const db = getDb();

  const results = await db.query.subscriptions.findMany({
    where: eq(subscriptions.orgId, orgId),
    columns: {
      category: true,
    },
  });

  const counts: Record<string, number> = {};
  for (const s of results) {
    const category = s.category || "Uncategorized";
    counts[category] = (counts[category] || 0) + 1;
  }

  return counts;
}
