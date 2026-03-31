/**
 * Permission utilities for preview vs paid plan access control
 */

export type PlanType = "starter" | "growth" | "business" | null;

export interface OrganizationForAccess {
  plan: PlanType;
  previewStartedAt: Date | null;
  previewEndsAt: Date | null;
}

export interface PreviewLimits {
  maxVisibleSubscriptions: 5;
  maxCsvImports: 1;
  maxVisibleDuplicates: 1;
  canExport: false;
  canAccessAlerts: false;
  canAccessRenewals: false;
}

export interface PaidLimits {
  maxVisibleSubscriptions: null;
  maxCsvImports: null;
  maxVisibleDuplicates: null;
  canExport: true;
  canAccessAlerts: true;
  canAccessRenewals: true;
}

export type AccessLimits = PreviewLimits | PaidLimits;

export interface OrgAccess {
  isPreview: boolean;
  isPaid: boolean;
  isExpired: boolean;
  daysRemaining: number;
  limits: AccessLimits;
}

const PREVIEW_LIMITS: PreviewLimits = {
  maxVisibleSubscriptions: 5,
  maxCsvImports: 1,
  maxVisibleDuplicates: 1,
  canExport: false,
  canAccessAlerts: false,
  canAccessRenewals: false,
};

const PAID_LIMITS: PaidLimits = {
  maxVisibleSubscriptions: null,
  maxCsvImports: null,
  maxVisibleDuplicates: null,
  canExport: true,
  canAccessAlerts: true,
  canAccessRenewals: true,
};

/**
 * Calculate days remaining in preview period
 */
export function getDaysRemaining(previewEndsAt: Date | string | null): number {
  if (!previewEndsAt) return 0;
  const endDate = typeof previewEndsAt === "string" ? new Date(previewEndsAt) : previewEndsAt;
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Check if organization is currently in preview period
 */
export function isInPreview(org: OrganizationForAccess): boolean {
  // If org has a paid plan, not in preview
  if (org.plan !== null) return false;
  // If no preview dates set, not in preview
  if (!org.previewEndsAt) return false;
  // Check if preview is still active
  const endDate = typeof org.previewEndsAt === "string"
    ? new Date(org.previewEndsAt)
    : org.previewEndsAt;
  return new Date() < endDate;
}

/**
 * Check if preview has expired (no plan and past preview end date)
 */
export function isPreviewExpired(org: OrganizationForAccess): boolean {
  if (org.plan !== null) return false;
  if (!org.previewEndsAt) return true;
  const endDate = typeof org.previewEndsAt === "string"
    ? new Date(org.previewEndsAt)
    : org.previewEndsAt;
  return new Date() >= endDate;
}

/**
 * Get complete access information for an organization
 */
export function getOrgAccess(org: OrganizationForAccess): OrgAccess {
  const isPaid = org.plan !== null;
  const inPreview = isInPreview(org);
  const expired = isPreviewExpired(org);
  const daysRemaining = getDaysRemaining(org.previewEndsAt);

  return {
    isPreview: inPreview,
    isPaid,
    isExpired: expired,
    daysRemaining,
    limits: isPaid ? PAID_LIMITS : PREVIEW_LIMITS,
  };
}

/**
 * Check if a specific action is allowed
 */
export function canPerformAction(
  org: OrganizationForAccess,
  action: "import_csv" | "export" | "view_alerts" | "view_renewals",
  currentCount?: number
): { allowed: boolean; reason?: string } {
  const access = getOrgAccess(org);

  if (access.isExpired) {
    return {
      allowed: false,
      reason: "Your preview has expired. Upgrade to continue using SubSleuth.",
    };
  }

  switch (action) {
    case "import_csv":
      if (access.limits.maxCsvImports === null) return { allowed: true };
      if (currentCount !== undefined && currentCount >= access.limits.maxCsvImports) {
        return {
          allowed: false,
          reason: "Preview includes 1 CSV import. Upgrade to import more files.",
        };
      }
      return { allowed: true };

    case "export":
      return access.limits.canExport
        ? { allowed: true }
        : { allowed: false, reason: "Upgrade to export your subscription data." };

    case "view_alerts":
      return access.limits.canAccessAlerts
        ? { allowed: true }
        : { allowed: false, reason: "Upgrade to set up alerts and never miss a renewal." };

    case "view_renewals":
      return access.limits.canAccessRenewals
        ? { allowed: true }
        : { allowed: false, reason: "Upgrade to track renewals and manage your calendar." };

    default:
      return { allowed: true };
  }
}

/**
 * Helper to build access from session data (for client-side use)
 */
export function getAccessFromSession(session: {
  organizationPlan?: PlanType;
  previewEndsAt?: string | null;
}): OrgAccess {
  const org: OrganizationForAccess = {
    plan: session.organizationPlan ?? null,
    previewStartedAt: null,
    previewEndsAt: session.previewEndsAt ? new Date(session.previewEndsAt) : null,
  };
  return getOrgAccess(org);
}
