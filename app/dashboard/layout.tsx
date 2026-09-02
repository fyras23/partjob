import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/layouts/StudentNav";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Recruiters get sidebar layout, students get top-nav
  if (session.user.role === "RECRUITER") {
    return (
      <div className="min-h-screen bg-bg flex">
        <DashboardSidebar role="RECRUITER" />
        <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 min-h-screen">{children}</main>
      </div>
    );
  }

  // Student
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <StudentNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
