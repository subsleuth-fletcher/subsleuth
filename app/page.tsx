import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { CTASection } from "@/components/landing/cta-section";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <HowItWorks />
        <Features />
        {/* TODO: Add upload/analyze section in future PR */}
        <section id="analyze" className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Analyze Your Spend
              </h2>
              <p className="text-lg text-muted-foreground">
                Drop your expense CSV below or try our sample data to see how it
                works
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Upload functionality coming soon
                </h3>
                <p className="text-muted-foreground mb-6">
                  We&apos;re building the full SaaS experience. Check back soon!
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports exports from banks, credit cards, QuickBooks, Xero,
                  and more
                </p>
              </div>
            </div>
          </div>
        </section>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
