"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-background/80 backdrop-blur-xl",
        scrolled ? "border-b border-border" : "border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-extrabold">
              SubSleuth
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="#features"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Button size="sm" asChild>
              <Link href="#analyze">Analyze Now</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
