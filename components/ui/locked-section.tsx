"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LockedSectionProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function LockedSection({
  title,
  description,
  ctaText = "Upgrade to Unlock",
  ctaHref = "/pricing",
  className,
  children,
}: LockedSectionProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Blurred background content preview */}
      {children && (
        <div className="absolute inset-0 blur-sm opacity-40 pointer-events-none select-none">
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-card/90 backdrop-blur-[2px] min-h-[200px]">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold mb-2 text-center">
          {title}
        </h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6 text-sm">
          {description}
        </p>
        <Button asChild>
          <Link href={ctaHref}>{ctaText}</Link>
        </Button>
      </div>
    </Card>
  );
}

/**
 * A simpler inline locked indicator for smaller UI elements
 */
export function LockedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground",
        className
      )}
    >
      <Lock className="w-3 h-3" />
      Locked
    </span>
  );
}
