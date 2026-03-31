"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  parseCSV,
  analyzeTransactions,
  generateCSVReport,
  calculateSavingsPercentage,
} from "@/lib/saas-detection";
import { SAMPLE_TRANSACTIONS } from "@/lib/constants";
import { AnalysisResults, DetectedSubscription } from "@/types";
import { getAccessFromSession } from "@/lib/permissions";
import { Lock, EyeOff, Sparkles } from "lucide-react";

type UploadState = "idle" | "dragover" | "loading" | "results" | "blocked";

interface ImportStatus {
  canImport: boolean;
  importCount: number;
  isPreview: boolean;
  maxImports: number | null;
  daysRemaining: number;
}

export default function ImportPage() {
  const { data: session } = useSession();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get access info from session
  const access = session?.user
    ? getAccessFromSession({
        organizationPlan: session.user.organizationPlan,
        previewEndsAt: session.user.previewEndsAt,
      })
    : null;

  // Check import permission on mount
  useEffect(() => {
    async function checkImportStatus() {
      try {
        const res = await fetch("/api/imports");
        if (res.ok) {
          const data = await res.json();
          setImportStatus(data);
          if (!data.canImport) {
            setUploadState("blocked");
          }
        }
      } catch (err) {
        console.error("Failed to check import status:", err);
      }
    }
    checkImportStatus();
  }, []);

  // Save import to database
  const saveImport = useCallback(
    async (fileName: string, subscriptions: DetectedSubscription[]) => {
      setSaving(true);
      try {
        const res = await fetch("/api/imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            subscriptions: subscriptions.map((s) => ({
              vendorName: s.saasName,
              category: s.category,
              monthlyCost: s.amount,
              status: "active",
            })),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.requiresUpgrade) {
            setUploadState("blocked");
            return false;
          }
          throw new Error(data.error || "Failed to save import");
        }

        // Update import status
        setImportStatus((prev) =>
          prev ? { ...prev, importCount: prev.importCount + 1, canImport: false } : null
        );
        return true;
      } catch (err) {
        console.error("Failed to save import:", err);
        return true; // Still show results even if save failed
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setUploadState("loading");

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const { transactions, errors } = parseCSV(text);

        if (transactions.length === 0) {
          setError(
            errors.length > 0
              ? errors.join(". ")
              : "No valid transactions found in the file"
          );
          setUploadState("idle");
          return;
        }

        // Simulate brief loading for UX
        setTimeout(async () => {
          const analysisResults = analyzeTransactions(transactions);

          // Save to database
          await saveImport(file.name, analysisResults.allSubscriptions);

          setResults(analysisResults);
          setUploadState("results");
        }, 1000);
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setUploadState("idle");
      };

      reader.readAsText(file);
    },
    [saveImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (uploadState === "blocked") return;
      setUploadState("idle");

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        setError("Please upload a CSV file");
      }
    },
    [processFile, uploadState]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (uploadState !== "blocked") {
        setUploadState("dragover");
      }
    },
    [uploadState]
  );

  const handleDragLeave = useCallback(() => {
    if (uploadState !== "blocked") {
      setUploadState("idle");
    }
  }, [uploadState]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleSampleData = useCallback(async () => {
    setError(null);
    setUploadState("loading");

    setTimeout(async () => {
      const analysisResults = analyzeTransactions(SAMPLE_TRANSACTIONS);

      // Save to database
      await saveImport("sample-data.csv", analysisResults.allSubscriptions);

      setResults(analysisResults);
      setUploadState("results");
    }, 1500);
  }, [saveImport]);

  const handleDownloadReport = useCallback(() => {
    if (!results) return;

    // Check if preview user
    if (access?.isPreview) {
      // Can't export in preview
      return;
    }

    const csv = generateCSVReport(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subsleuth-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [results, access]);

  const handleReset = useCallback(() => {
    // Check if can import again
    if (importStatus && !importStatus.canImport) {
      setUploadState("blocked");
    } else {
      setUploadState("idle");
    }
    setResults(null);
    setError(null);
  }, [importStatus]);

  // Apply preview limits to results
  const limitedResults = results
    ? applyPreviewLimits(results, access?.isPreview ?? false)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl">SubSleuth</span>
          </Link>
          {uploadState === "results" && !access?.isPreview && (
            <Button variant="secondary" onClick={handleReset}>
              New Analysis
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold mb-4">
            Analyze Your SaaS Spend
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your expense CSV to discover hidden costs, duplicate tools,
            and potential savings.
          </p>
        </div>

        {/* Blocked State - Preview limit reached */}
        {uploadState === "blocked" && (
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-card/50">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>

              <h3 className="font-display text-xl font-semibold mb-2">
                Preview Import Used
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your preview includes 1 CSV import. Upgrade to import unlimited
                files and track all your subscriptions.
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild>
                  <Link href="/pricing">Upgrade Now</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {uploadState === "loading" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-muted-foreground text-lg">
              {saving ? "Saving your results..." : "Analyzing your expenses..."}
            </p>
          </div>
        )}

        {/* Upload Zone */}
        {(uploadState === "idle" || uploadState === "dragover") && (
          <div className="max-w-2xl mx-auto">
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                uploadState === "dragover"
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-card"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <h3 className="font-display text-xl font-semibold mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-muted-foreground mb-6">
                or click to browse your computer
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose File
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSampleData();
                  }}
                >
                  Try Sample Data
                </Button>
              </div>

              <p className="text-muted-foreground text-sm mt-6">
                Supports exports from banks, credit cards, QuickBooks, Xero, and
                more
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {uploadState === "results" && limitedResults && (
          <div className="max-w-4xl mx-auto">
            {/* Preview Banner */}
            {access?.isPreview && (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        Found {results!.summary.subscriptionCount} subscriptions
                        {limitedResults.visibleCount < results!.summary.subscriptionCount && (
                          <span className="text-muted-foreground font-normal">
                            {" "}&mdash; {limitedResults.visibleCount} visible in preview
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {access.daysRemaining} day{access.daysRemaining !== 1 ? "s" : ""} left
                        {" "}&mdash; Upgrade to see all subscriptions and export data
                      </p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0">
                    <Link href="/pricing">Unlock All</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                label="Total SaaS Spend"
                value={formatCurrency(results!.summary.totalSpend)}
              />
              <SummaryCard
                label="Subscriptions Found"
                value={results!.summary.subscriptionCount.toString()}
              />
              <SummaryCard
                label="Potential Savings"
                value={formatCurrency(results!.summary.potentialSavings)}
                highlight
              />
              <SummaryCard
                label="Duplicate Categories"
                value={
                  access?.isPreview
                    ? limitedResults.duplicateCount > 0
                      ? "1+"
                      : "0"
                    : results!.summary.duplicateCount.toString()
                }
              />
            </div>

            {/* Savings Banner */}
            {results!.summary.potentialSavings > 0 && (
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <p className="text-primary font-semibold text-lg">
                      You could save{" "}
                      {formatCurrency(results!.summary.potentialSavings)} (
                      {calculateSavingsPercentage(results!.summary)}% of spend)
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Review the findings below to optimize your subscriptions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Findings Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold">
                Detailed Findings
              </h2>
              {access?.isPreview ? (
                <Button variant="secondary" disabled className="opacity-50">
                  <Lock className="w-4 h-4 mr-2" />
                  Export (Upgrade Required)
                </Button>
              ) : (
                <Button variant="secondary" onClick={handleDownloadReport}>
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Report
                </Button>
              )}
            </div>

            {/* Findings Groups */}
            <div className="space-y-8">
              <FindingsGroup
                title="Potential Waste"
                emoji="🔴"
                items={limitedResults.findings.waste}
                tagClass="bg-destructive/15 text-destructive"
              />
              <FindingsGroup
                title="Duplicate Tools"
                emoji="🟡"
                items={limitedResults.findings.duplicate}
                tagClass="bg-yellow-500/15 text-yellow-500"
                hiddenCount={
                  access?.isPreview
                    ? results!.findings.duplicate.length - limitedResults.findings.duplicate.length
                    : 0
                }
              />
              <FindingsGroup
                title="Worth Reviewing"
                emoji="🟣"
                items={limitedResults.findings.review}
                tagClass="bg-purple-500/15 text-purple-500"
              />
              <FindingsGroup
                title="Looks Good"
                emoji="✅"
                items={limitedResults.findings.good}
                tagClass="bg-primary/15 text-primary"
              />
            </div>

            {/* Hidden Items Banner */}
            {access?.isPreview && limitedResults.hiddenCount > 0 && (
              <div className="mt-8 p-6 bg-secondary/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">
                      {limitedResults.hiddenCount} more subscription{limitedResults.hiddenCount !== 1 ? "s" : ""} hidden
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to see your complete SaaS inventory
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/pricing">Unlock Full Report</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Apply preview limits to results
 */
function applyPreviewLimits(
  results: AnalysisResults,
  isPreview: boolean
): {
  findings: typeof results.findings;
  visibleCount: number;
  hiddenCount: number;
  duplicateCount: number;
} {
  if (!isPreview) {
    return {
      findings: results.findings,
      visibleCount: results.summary.subscriptionCount,
      hiddenCount: 0,
      duplicateCount: results.summary.duplicateCount,
    };
  }

  const maxVisible = 5;
  const maxDuplicates = 1;

  // Limit total visible subscriptions to 5
  let remaining = maxVisible;
  const limitedFindings = {
    waste: results.findings.waste.slice(0, remaining),
    duplicate: [] as DetectedSubscription[],
    review: [] as DetectedSubscription[],
    good: [] as DetectedSubscription[],
  };

  remaining -= limitedFindings.waste.length;

  // Limit duplicates to 1
  if (remaining > 0) {
    limitedFindings.duplicate = results.findings.duplicate.slice(
      0,
      Math.min(maxDuplicates, remaining)
    );
    remaining -= limitedFindings.duplicate.length;
  }

  if (remaining > 0) {
    limitedFindings.review = results.findings.review.slice(0, remaining);
    remaining -= limitedFindings.review.length;
  }

  if (remaining > 0) {
    limitedFindings.good = results.findings.good.slice(0, remaining);
  }

  const visibleCount =
    limitedFindings.waste.length +
    limitedFindings.duplicate.length +
    limitedFindings.review.length +
    limitedFindings.good.length;

  return {
    findings: limitedFindings,
    visibleCount,
    hiddenCount: results.summary.subscriptionCount - visibleCount,
    duplicateCount: results.summary.duplicateCount,
  };
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 text-center border",
        highlight
          ? "bg-gradient-to-br from-card to-primary/10 border-primary/30"
          : "bg-card border-border"
      )}
    >
      <div
        className={cn(
          "font-display text-2xl font-bold mb-1",
          highlight && "text-primary"
        )}
      >
        {value}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}

function FindingsGroup({
  title,
  emoji,
  items,
  tagClass,
  hiddenCount = 0,
}: {
  title: string;
  emoji: string;
  items: DetectedSubscription[];
  tagClass: string;
  hiddenCount?: number;
}) {
  if (items.length === 0 && hiddenCount === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <span>{emoji}</span>
        <h3 className="font-semibold">{title}</h3>
        <span className="bg-secondary px-3 py-1 rounded-full text-xs text-muted-foreground">
          {items.length}
          {hiddenCount > 0 && `+${hiddenCount} hidden`}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <FindingItem key={index} item={item} tagClass={tagClass} />
        ))}
        {hiddenCount > 0 && (
          <div className="text-center py-3 text-sm text-muted-foreground">
            +{hiddenCount} more hidden in preview
          </div>
        )}
      </div>
    </div>
  );
}

function FindingItem({
  item,
  tagClass,
}: {
  item: DetectedSubscription;
  tagClass: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 hover:border-border/80 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-secondary rounded-lg flex items-center justify-center text-xl">
          {item.icon}
        </div>
        <div>
          <h4 className="font-semibold">{item.saasName}</h4>
          <p className="text-muted-foreground text-sm">
            {item.category} &bull; {item.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-display font-bold text-lg">
          {formatCurrency(item.amount)}
        </span>
        <span
          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", tagClass)}
        >
          {item.statusLabel}
        </span>
      </div>
    </div>
  );
}
