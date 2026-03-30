import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center gap-4">
            <MobileSidebar />
            <span className="font-display font-bold text-lg">SubSleuth</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
