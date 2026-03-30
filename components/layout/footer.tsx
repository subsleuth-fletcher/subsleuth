import Link from "next/link";
import { Search } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-extrabold">
              SubSleuth
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SubSleuth. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
