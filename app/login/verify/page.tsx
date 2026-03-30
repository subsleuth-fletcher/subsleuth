import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern">
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-subsleuth-green flex items-center justify-center">
              <span className="text-subsleuth-dark font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-display font-bold text-white">
              SubSleuth
            </span>
          </Link>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-subsleuth-green/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-subsleuth-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <CardTitle className="text-white">Check your email</CardTitle>
            <CardDescription>
              We sent you a magic link to sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in your email to sign in to your account. The link
              will expire in 24 hours.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive an email?{" "}
              <Link href="/login" className="text-subsleuth-green hover:underline">
                Try again
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
