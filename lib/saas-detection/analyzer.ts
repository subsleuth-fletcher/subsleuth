import {
  Transaction,
  DetectedSubscription,
  AnalysisResults,
  AnalysisFindings,
  AnalysisSummary,
  SaaSCategory,
} from "@/types";
import { findVendorByDescription } from "./vendors";

/**
 * Configuration for analysis thresholds
 */
export const ANALYSIS_CONFIG = {
  // Amount thresholds for categorization
  highCostThreshold: 1000,
  mediumCostThreshold: 500,
  // Duplicate savings estimate (assume 50% of duplicate could be saved)
  duplicateSavingsRate: 0.5,
};

/**
 * Detect SaaS subscription from a transaction
 */
export function detectSaaS(
  transaction: Transaction
): DetectedSubscription | null {
  const vendor = findVendorByDescription(transaction.description);

  if (!vendor) {
    return null;
  }

  return {
    ...transaction,
    saasName: vendor.name,
    category: vendor.category,
    icon: vendor.icon,
    matched: true,
  };
}

/**
 * Find duplicate tools - multiple subscriptions in the same category
 */
function findDuplicateCategories(
  subscriptions: DetectedSubscription[]
): Set<string> {
  const categoryMap = new Map<SaaSCategory, DetectedSubscription[]>();

  for (const sub of subscriptions) {
    const existing = categoryMap.get(sub.category) || [];
    existing.push(sub);
    categoryMap.set(sub.category, existing);
  }

  const duplicateNames = new Set<string>();
  Array.from(categoryMap.values()).forEach((tools) => {
    if (tools.length > 1) {
      tools.forEach((t: DetectedSubscription) => duplicateNames.add(t.saasName));
    }
  });

  return duplicateNames;
}

/**
 * Categorize findings based on status
 */
function categorizeFindings(
  subscriptions: DetectedSubscription[],
  duplicateNames: Set<string>
): AnalysisFindings {
  const findings: AnalysisFindings = {
    waste: [],
    duplicate: [],
    review: [],
    good: [],
  };

  for (const sub of subscriptions) {
    const isDuplicate = duplicateNames.has(sub.saasName);
    const isHighCost = sub.amount > ANALYSIS_CONFIG.highCostThreshold;
    const isMediumCost = sub.amount > ANALYSIS_CONFIG.mediumCostThreshold;

    if (isDuplicate && isHighCost) {
      // High-cost duplicate = potential waste
      sub.status = "waste";
      sub.statusLabel = "Potential Waste";
      findings.waste.push(sub);
    } else if (isDuplicate) {
      // Lower-cost duplicate = just flag as duplicate
      sub.status = "duplicate";
      sub.statusLabel = "Duplicate Tool";
      findings.duplicate.push(sub);
    } else if (isHighCost || isMediumCost) {
      // High cost but not duplicate = worth reviewing
      sub.status = "review";
      sub.statusLabel = "Worth Reviewing";
      findings.review.push(sub);
    } else {
      // Low cost, not duplicate = looks fine
      sub.status = "good";
      sub.statusLabel = "Looks Good";
      findings.good.push(sub);
    }
  }

  return findings;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(
  subscriptions: DetectedSubscription[],
  findings: AnalysisFindings,
  categoryMap: Map<SaaSCategory, DetectedSubscription[]>
): AnalysisSummary {
  const totalSpend = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  // Calculate potential savings from waste and duplicates
  const wasteSavings = findings.waste.reduce((sum, sub) => sum + sub.amount, 0);
  const duplicateSavings =
    findings.duplicate.reduce((sum, sub) => sum + sub.amount, 0) *
    ANALYSIS_CONFIG.duplicateSavingsRate;

  const potentialSavings = wasteSavings + duplicateSavings;

  // Count categories with duplicates
  let duplicateCount = 0;
  Array.from(categoryMap.values()).forEach((tools) => {
    if (tools.length > 1) {
      duplicateCount++;
    }
  });

  return {
    totalSpend,
    subscriptionCount: subscriptions.length,
    potentialSavings,
    duplicateCount,
  };
}

/**
 * Analyze transactions and return comprehensive results
 */
export function analyzeTransactions(
  transactions: Transaction[]
): AnalysisResults {
  const saasSubscriptions: DetectedSubscription[] = [];
  const categoryMap = new Map<SaaSCategory, DetectedSubscription[]>();
  const seenSubscriptions = new Map<string, DetectedSubscription>();

  // Detect SaaS subscriptions
  for (const tx of transactions) {
    const detected = detectSaaS(tx);
    if (!detected) continue;

    // Create a key to avoid exact duplicates (same name + same amount)
    const key = `${detected.saasName}-${detected.amount.toFixed(2)}`;

    // Skip if we've already seen this exact subscription
    if (seenSubscriptions.has(key)) {
      continue;
    }

    seenSubscriptions.set(key, detected);
    saasSubscriptions.push(detected);

    // Build category map
    const existing = categoryMap.get(detected.category) || [];
    existing.push(detected);
    categoryMap.set(detected.category, existing);
  }

  // Find duplicates
  const duplicateNames = findDuplicateCategories(saasSubscriptions);

  // Categorize findings
  const findings = categorizeFindings(saasSubscriptions, duplicateNames);

  // Calculate summary
  const summary = calculateSummary(saasSubscriptions, findings, categoryMap);

  // Convert categoryMap to plain object for serialization
  const categoryRecord: Record<string, DetectedSubscription[]> = {};
  Array.from(categoryMap.entries()).forEach(([key, value]) => {
    categoryRecord[key] = value;
  });

  return {
    findings,
    summary,
    categoryMap: categoryRecord,
    allSubscriptions: saasSubscriptions,
  };
}

/**
 * Get duplicate groups - returns categories with their duplicate tools
 */
export function getDuplicateGroups(
  results: AnalysisResults
): { category: SaaSCategory; tools: DetectedSubscription[] }[] {
  const groups: { category: SaaSCategory; tools: DetectedSubscription[] }[] =
    [];

  for (const [category, tools] of Object.entries(results.categoryMap)) {
    if (tools.length > 1) {
      groups.push({
        category: category as SaaSCategory,
        tools,
      });
    }
  }

  return groups;
}

/**
 * Generate CSV report from analysis results
 */
export function generateCSVReport(results: AnalysisResults): string {
  const { findings, summary } = results;

  // Flatten all items in priority order
  const allItems = [
    ...findings.waste,
    ...findings.duplicate,
    ...findings.review,
    ...findings.good,
  ];

  // Build CSV content
  let csv = "SaaS Name,Category,Amount,Status,Original Description\n";

  for (const item of allItems) {
    // Escape fields that might contain commas
    const escapedName = `"${item.saasName.replace(/"/g, '""')}"`;
    const escapedCategory = `"${item.category}"`;
    const escapedStatus = `"${item.statusLabel || item.status}"`;
    const escapedDescription = `"${item.description.replace(/"/g, '""')}"`;

    csv += `${escapedName},${escapedCategory},${item.amount.toFixed(2)},${escapedStatus},${escapedDescription}\n`;
  }

  // Add summary section
  csv += "\n";
  csv += "Summary\n";
  csv += `Total SaaS Spend,$${summary.totalSpend.toFixed(2)}\n`;
  csv += `Potential Savings,$${summary.potentialSavings.toFixed(2)}\n`;
  csv += `Subscriptions Found,${summary.subscriptionCount}\n`;
  csv += `Duplicate Categories,${summary.duplicateCount}\n`;

  return csv;
}

/**
 * Calculate savings percentage
 */
export function calculateSavingsPercentage(
  summary: AnalysisSummary
): number {
  if (summary.totalSpend === 0) return 0;
  return Math.round((summary.potentialSavings / summary.totalSpend) * 100);
}
