import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Stop Overpaying?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of companies saving thousands on SaaS every month
          </p>
          <Button size="lg" asChild>
            <Link href="#analyze">Analyze My Spend Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
