"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Search, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: 1,
    title: "Upload Your CSV",
    description:
      "Export transactions from your bank, credit card, or accounting software and drop the file here",
    icon: Upload,
  },
  {
    number: 2,
    title: "We Analyze",
    description:
      "Our system identifies SaaS subscriptions, flags duplicates, and spots potential waste in seconds",
    icon: Search,
  },
  {
    number: 3,
    title: "See Your Savings",
    description:
      "Get a detailed breakdown of findings with actionable recommendations to cut unnecessary costs",
    icon: TrendingDown,
  },
];

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}

function StepCard({ number, title, description, icon: Icon, delay }: StepCardProps) {
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
        "bg-card border border-border rounded-2xl p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:border-primary hover:shadow-lg hover:shadow-primary/10",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      )}
    >
      <div className="w-12 h-12 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center font-display font-extrabold text-xl text-primary mx-auto mb-6">
        {number}
      </div>
      <div className="w-16 h-16 mx-auto mb-5 text-primary">
        <Icon className="w-full h-full stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to uncover hidden costs and optimize your
            software spending
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} {...step} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
