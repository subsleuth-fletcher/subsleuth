"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface PreviewBannerProps {
  totalSubscriptions: number;
  visibleSubscriptions: number;
  daysRemaining: number;
}

export function PreviewBanner({
  totalSubscriptions,
  visibleSubscriptions,
  daysRemaining,
}: PreviewBannerProps) {
  const hiddenCount = totalSubscriptions - visibleSubscriptions;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">
              We found {totalSubscriptions} subscription{totalSubscriptions !== 1 ? "s" : ""}
              {hiddenCount > 0 && (
                <span className="text-muted-foreground font-normal">
                  {" "}&mdash; {visibleSubscriptions} visible in preview
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {daysRemaining > 0 ? (
                <>
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in preview
                </>
              ) : (
                <>Preview expired</>
              )}
              {" "}&mdash; Unlock full visibility and ongoing monitoring
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/pricing">Unlock All Features</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Smaller banner for showing hidden subscription count
 */
interface HiddenCountBannerProps {
  hiddenCount: number;
  className?: string;
}

export function HiddenCountBanner({ hiddenCount, className }: HiddenCountBannerProps) {
  if (hiddenCount <= 0) return null;

  return (
    <div className={`flex items-center justify-between p-4 bg-secondary/50 rounded-lg ${className || ""}`}>
      <div className="flex items-center gap-3">
        <EyeOff className="w-5 h-5 text-muted-foreground" />
        <span className="text-muted-foreground">
          {hiddenCount} more subscription{hiddenCount !== 1 ? "s" : ""} hidden in preview
        </span>
      </div>
      <Button variant="secondary" size="sm" asChild>
        <Link href="/pricing">Unlock All</Link>
      </Button>
    </div>
  );
}

/**
 * Compact preview status for sidebar or header
 */
interface PreviewStatusProps {
  daysRemaining: number;
}

export function PreviewStatus({ daysRemaining }: PreviewStatusProps) {
  return (
    <div className="px-3 py-2 bg-primary/10 rounded-lg">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="w-4 h-4 text-primary" />
        <span className="font-medium">Preview Mode</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {daysRemaining > 0
          ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
          : "Expired"}
      </p>
    </div>
  );
}
