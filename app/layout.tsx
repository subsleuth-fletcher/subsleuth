import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SubSleuth - Stop Bleeding Money on Forgotten Software",
  description:
    "Upload your expense data and discover wasted SaaS spend in 2 minutes. Find ghost subscriptions, duplicate tools, and hidden costs.",
  keywords: [
    "SaaS management",
    "subscription tracking",
    "expense optimization",
    "software spend",
    "SaaS audit",
  ],
  authors: [{ name: "SubSleuth" }],
  openGraph: {
    title: "SubSleuth - Stop Bleeding Money on Forgotten Software",
    description:
      "Upload your expense data and discover wasted SaaS spend in 2 minutes. Find ghost subscriptions, duplicate tools, and hidden costs.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SubSleuth - Stop Bleeding Money on Forgotten Software",
    description:
      "Upload your expense data and discover wasted SaaS spend in 2 minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${syne.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
