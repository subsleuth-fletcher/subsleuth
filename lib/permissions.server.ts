/**
 * Server-side permission helpers that interact with the database
 */
import { getDb, organizations, csvImports } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { getOrgAccess, canPerformAction, type OrganizationForAccess } from "./permissions";

/**
 * Fetch organization context from database
 */
export async function getOrgContext(orgId: string): Promise<OrganizationForAccess | null> {
  const db = getDb();
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) return null;

  return {
    plan: org.plan,
    previewStartedAt: org.previewStartedAt,
    previewEndsAt: org.previewEndsAt,
  };
}

/**
 * Get count of CSV imports for an organization
 */
export async function getCsvImportCount(orgId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: count() })
    .from(csvImports)
    .where(eq(csvImports.orgId, orgId));
  return result[0]?.count ?? 0;
}

/**
 * Check if organization can perform a CSV import
 */
export async function canImportCsv(orgId: string): Promise<{
  allowed: boolean;
  reason?: string;
  importCount: number;
}> {
  const [orgContext, importCount] = await Promise.all([
    getOrgContext(orgId),
    getCsvImportCount(orgId),
  ]);

  if (!orgContext) {
    return {
      allowed: false,
      reason: "Organization not found.",
      importCount: 0,
    };
  }

  const permission = canPerformAction(orgContext, "import_csv", importCount);

  return {
    allowed: permission.allowed,
    reason: permission.reason,
    importCount,
  };
}

/**
 * Get full org access info with import count
 */
export async function getOrgAccessWithImports(orgId: string) {
  const [orgContext, importCount] = await Promise.all([
    getOrgContext(orgId),
    getCsvImportCount(orgId),
  ]);

  if (!orgContext) return null;

  const access = getOrgAccess(orgContext);

  return {
    ...access,
    importCount,
    canImport: access.limits.maxCsvImports === null || importCount < access.limits.maxCsvImports,
  };
}
