import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { StudentNav } from "@/components/layouts/StudentNav";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";

// Recruiter-only sub-paths within /dashboard
const RECRUITER_ONLY = ["/dashboard/posts", "/dashboard/profile"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const role = session.user.role;

  // Admins should be at /admin, not /dashboard
  if (role === "ADMIN") redirect("/admin");

  // Get current path to enforce recruiter-only sub-pages
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";

  // Students cannot access recruiter-only pages
  if (role === "STUDENT") {
    const blocked = RECRUITER_ONLY.some((p) => pathname.startsWith(p));
    if (blocked) redirect("/jobs");
  }

  // Recruiters — sidebar layout
  if (role === "RECRUITER") {
    return (
      <div className="min-h-screen bg-bg flex">
        <DashboardSidebar role="RECRUITER" />
        <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Students — top-nav layout
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <StudentNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
