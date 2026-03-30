"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "text-center transition-all duration-700 transform",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      )}
    >
      <div className="font-display text-4xl md:text-5xl font-extrabold text-primary mb-2">
        {value}
      </div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

export function StatsBar() {
  return (
    <section className="py-12 bg-secondary/50 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <StatItem value="25-30%" label="Average SaaS spend wasted" />
          <StatItem value="$4,200" label="Average monthly savings found" />
          <StatItem value="2 min" label="To get your report" />
        </div>
      </div>
    </section>
  );
}
