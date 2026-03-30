"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  parseCSV,
  analyzeTransactions,
  generateCSVReport,
  calculateSavingsPercentage,
} from "@/lib/saas-detection";
import { SAMPLE_TRANSACTIONS } from "@/lib/constants";
import {
  AnalysisResults,
  DetectedSubscription,
} from "@/types";

type UploadState = "idle" | "dragover" | "loading" | "results";

export default function ImportPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    setUploadState("loading");

    const reader = new FileReader();
    reader.onload = (e) => {
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
      setTimeout(() => {
        const analysisResults = analyzeTransactions(transactions);
        setResults(analysisResults);
        setUploadState("results");
      }, 1000);
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setUploadState("idle");
    };

    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setUploadState("idle");

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        setError("Please upload a CSV file");
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("dragover");
  }, []);

  const handleDragLeave = useCallback(() => {
    setUploadState("idle");
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleSampleData = useCallback(() => {
    setError(null);
    setUploadState("loading");

    setTimeout(() => {
      const analysisResults = analyzeTransactions(SAMPLE_TRANSACTIONS);
      setResults(analysisResults);
      setUploadState("results");
    }, 1500);
  }, []);

  const handleDownloadReport = useCallback(() => {
    if (!results) return;

    const csv = generateCSVReport(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subsleuth-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleReset = useCallback(() => {
    setResults(null);
    setUploadState("idle");
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
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
          </a>
          {uploadState === "results" && (
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

        {/* Loading State */}
        {uploadState === "loading" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-muted-foreground text-lg">
              Analyzing your expenses...
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
        {uploadState === "results" && results && (
          <div className="max-w-4xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                label="Total SaaS Spend"
                value={formatCurrency(results.summary.totalSpend)}
              />
              <SummaryCard
                label="Subscriptions Found"
                value={results.summary.subscriptionCount.toString()}
              />
              <SummaryCard
                label="Potential Savings"
                value={formatCurrency(results.summary.potentialSavings)}
                highlight
              />
              <SummaryCard
                label="Duplicate Categories"
                value={results.summary.duplicateCount.toString()}
              />
            </div>

            {/* Savings Banner */}
            {results.summary.potentialSavings > 0 && (
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <p className="text-primary font-semibold text-lg">
                      You could save{" "}
                      {formatCurrency(results.summary.potentialSavings)} (
                      {calculateSavingsPercentage(results.summary)}% of spend)
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
            </div>

            {/* Findings Groups */}
            <div className="space-y-8">
              <FindingsGroup
                title="Potential Waste"
                emoji="🔴"
                items={results.findings.waste}
                tagClass="bg-destructive/15 text-destructive"
              />
              <FindingsGroup
                title="Duplicate Tools"
                emoji="🟡"
                items={results.findings.duplicate}
                tagClass="bg-yellow-500/15 text-yellow-500"
              />
              <FindingsGroup
                title="Worth Reviewing"
                emoji="🟣"
                items={results.findings.review}
                tagClass="bg-purple-500/15 text-purple-500"
              />
              <FindingsGroup
                title="Looks Good"
                emoji="✅"
                items={results.findings.good}
                tagClass="bg-primary/15 text-primary"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
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
}: {
  title: string;
  emoji: string;
  items: DetectedSubscription[];
  tagClass: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <span>{emoji}</span>
        <h3 className="font-semibold">{title}</h3>
        <span className="bg-secondary px-3 py-1 rounded-full text-xs text-muted-foreground">
          {items.length} item{items.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <FindingItem key={index} item={item} tagClass={tagClass} />
        ))}
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
        <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", tagClass)}>
          {item.statusLabel}
        </span>
      </div>
    </div>
  );
}
