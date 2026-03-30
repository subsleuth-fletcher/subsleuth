import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-radial-gradient animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-50" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/50 px-4 py-2 rounded-full text-sm text-primary mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>Free SaaS Audit Tool</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-up-delay-1">
            Stop Bleeding Money on{" "}
            <span className="text-primary">Forgotten Software</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up-delay-2">
            Upload your expense data and discover the SaaS subscriptions
            draining your budget. Ghost subscriptions, duplicate tools, and
            sneaky price hikes — we find them all in under 2 minutes.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up-delay-3">
            <Button size="xl" asChild className="group">
              <Link href="#analyze">
                Audit My SaaS Spend
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
