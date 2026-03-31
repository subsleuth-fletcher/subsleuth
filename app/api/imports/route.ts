import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, csvImports, subscriptions } from "@/lib/db";
import { canImportCsv, getOrgAccessWithImports } from "@/lib/permissions.server";

interface ImportedSubscription {
  vendorName: string;
  category?: string;
  monthlyCost: string | number;
  billingCycle?: "monthly" | "quarterly" | "annual";
  status?: "active" | "cancelled" | "trial";
}

/**
 * POST /api/imports - Save a CSV import and its detected subscriptions
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  // Check if user can import
  const permission = await canImportCsv(orgId);
  if (!permission.allowed) {
    return NextResponse.json(
      {
        error: permission.reason,
        requiresUpgrade: true,
        importCount: permission.importCount,
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { fileName, subscriptions: importedSubs } = body as {
      fileName: string;
      subscriptions: ImportedSubscription[];
    };

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const db = getDb();

    // Create import record
    const [importRecord] = await db
      .insert(csvImports)
      .values({
        orgId,
        uploadedBy: session.user.id,
        fileName,
        rowCount: importedSubs?.length ?? 0,
        status: "completed",
      })
      .returning();

    // Insert subscriptions if provided
    let subscriptionsCreated = 0;
    if (importedSubs && importedSubs.length > 0) {
      await db.insert(subscriptions).values(
        importedSubs.map((sub) => ({
          orgId,
          vendorName: sub.vendorName,
          category: sub.category || null,
          monthlyCost: String(sub.monthlyCost),
          billingCycle: sub.billingCycle || "monthly",
          status: sub.status || "active",
          detectedSource: "csv_import" as const,
        }))
      );
      subscriptionsCreated = importedSubs.length;
    }

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      subscriptionsCreated,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to save import" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/imports - Get import status and permission info
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  const access = await getOrgAccessWithImports(orgId);

  if (!access) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    importCount: access.importCount,
    canImport: access.canImport,
    isPreview: access.isPreview,
    isPaid: access.isPaid,
    isExpired: access.isExpired,
    daysRemaining: access.daysRemaining,
    maxImports: access.limits.maxCsvImports,
  });
}
