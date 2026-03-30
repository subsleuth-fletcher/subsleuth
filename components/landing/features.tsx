"use client";

import { useEffect, useRef, useState } from "react";
import { Ghost, Copy, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Ghost Subscriptions",
    description:
      "Tools that no one uses anymore but keep charging your card. Ex-employees' accounts, abandoned trials, forgotten tools.",
    icon: Ghost,
    color: "red",
  },
  {
    title: "Duplicate Tools",
    description:
      "Paying for Slack AND Microsoft Teams? Zoom AND Google Meet? We flag overlapping tools in the same category.",
    icon: Copy,
    color: "yellow",
  },
  {
    title: "Price Creep",
    description:
      "SaaS vendors love quiet price increases. We help you spot subscriptions that have grown beyond their value.",
    icon: TrendingUp,
    color: "purple",
  },
  {
    title: "Renewal Traps",
    description:
      "Annual renewals that auto-charge before you can evaluate. Get ahead of surprise renewals and negotiate better terms.",
    icon: Clock,
    color: "green",
  },
];

const colorClasses = {
  red: "bg-red-500/15 text-red-400",
  yellow: "bg-yellow-500/15 text-yellow-400",
  purple: "bg-purple-500/15 text-purple-400",
  green: "bg-primary/15 text-primary",
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: keyof typeof colorClasses;
  delay: number;
}

function FeatureCard({ title, description, icon: Icon, color, delay }: FeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-card border border-border rounded-2xl p-6 flex gap-5 transition-all duration-500 hover:translate-x-2 hover:border-border",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
          colorClasses[color]
        )}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            What We Detect
          </h2>
          <p className="text-lg text-muted-foreground">
            Our analysis uncovers the hidden costs that silently drain your
            budget every month
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              color={feature.color as keyof typeof colorClasses}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
